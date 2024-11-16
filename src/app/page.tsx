import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Trash2 } from 'lucide-react';

const LandingPage = () => {
  // TimeTracker Component Logic
  const timeSlots = [
    "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00",
    "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00"
  ];

  const days = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  
  const createEmptyWeek = () => {
    const weekData = {};
    days.forEach(day => {
      weekData[day] = {};
      timeSlots.forEach(slot => {
        weekData[day][slot] = '';
      });
    });
    return weekData;
  };

  const [timesheet, setTimesheet] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem('timesheet');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.week1 && parsed.week2) {
            return parsed;
          }
        }
      } catch (error) {
        console.error('Error loading timesheet data:', error);
      }
    }
    return {
      week1: createEmptyWeek(),
      week2: createEmptyWeek()
    };
  });

  const [projects, setProjects] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedProjects = localStorage.getItem('projects');
        return savedProjects ? JSON.parse(savedProjects) : [];
      } catch (error) {
        console.error('Error loading projects:', error);
        return [];
      }
    }
    return [];
  });

  const [newProject, setNewProject] = useState('');
  const [projectHours, setProjectHours] = useState({});
  const [activeWeek, setActiveWeek] = useState('week1');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('timesheet', JSON.stringify(timesheet));
        localStorage.setItem('projects', JSON.stringify(projects));
        calculateHours();
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }
  }, [timesheet, projects]);

  const calculateHours = () => {
    const hours = {};
    ['week1', 'week2'].forEach(week => {
      if (timesheet[week]) {
        days.forEach(day => {
          if (timesheet[week][day]) {
            Object.values(timesheet[week][day]).forEach(activity => {
              if (!activity) return;
              if (activity.includes('/')) {
                const subActivities = activity.split('/');
                subActivities.forEach(subActivity => {
                  hours[subActivity] = (hours[subActivity] || 0) + 0.5;
                });
              } else {
                hours[activity] = (hours[activity] || 0) + 1;
              }
            });
          }
        });
      }
    });
    setProjectHours(hours);
  };

  const handleAddProject = () => {
    if (newProject && !projects.includes(newProject)) {
      setProjects([...projects, newProject]);
      setNewProject('');
    }
  };

  const handleRemoveProject = (projectToRemove) => {
    setProjects(projects.filter(project => project !== projectToRemove));
    const updatedTimesheet = {
      week1: {...timesheet.week1},
      week2: {...timesheet.week2}
    };
    ['week1', 'week2'].forEach(week => {
      days.forEach(day => {
        if (updatedTimesheet[week][day]) {
          Object.keys(updatedTimesheet[week][day]).forEach(slot => {
            if (updatedTimesheet[week][day][slot] === projectToRemove) {
              updatedTimesheet[week][day][slot] = '';
            }
          });
        }
      });
    });
    setTimesheet(updatedTimesheet);
  };

  const handleActivityChange = (week, day, timeSlot, value) => {
    setTimesheet(prev => ({
      ...prev,
      [week]: {
        ...prev[week],
        [day]: {
          ...prev[week][day],
          [timeSlot]: value
        }
      }
    }));
  };

  const calculateStoryPoints = (hours) => {
    return (hours / 8).toFixed(1);
  };

  const chartData = Object.entries(projectHours)
    .filter(([name]) => name !== '')
    .map(([name, hours]) => ({
      name,
      hours,
      storyPoints: calculateStoryPoints(hours)
    }))
    .sort((a, b) => b.hours - a.hours);

  const WeekTable = ({ week }) => (
    <div className="overflow-x-auto mt-4">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 border">Ore</th>
            {days.map(day => (
              <th key={day} className="p-2 border">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(timeSlot => (
            <tr key={timeSlot}>
              <td className="p-2 border">{timeSlot}</td>
              {days.map(day => (
                <td key={`${day}-${timeSlot}`} className="p-2 border">
                  <select
                    className="w-full p-1 border rounded"
                    value={timesheet[week]?.[day]?.[timeSlot] || ''}
                    onChange={(e) => handleActivityChange(week, day, timeSlot, e.target.value)}
                  >
                    <option value="">-</option>
                    {projects.map(project => (
                      <option key={project} value={project}>
                        {project}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const totalStoryPoints = chartData.reduce((total, project) => 
    total + parseFloat(project.storyPoints), 0
  ).toFixed(1);

  const TimeTrackerComponent = () => (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestione Timesheet Sprint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Aggiungi nuovo progetto"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleAddProject}>Aggiungi Progetto</Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {projects.map(project => (
                <div key={project} className="flex items-center justify-between p-2 border rounded">
                  <span>{project}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveProject(project)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Tabs defaultValue="week1" onValueChange={setActiveWeek}>
            <TabsList>
              <TabsTrigger value="week1">Settimana 1</TabsTrigger>
              <TabsTrigger value="week2">Settimana 2</TabsTrigger>
            </TabsList>
            <TabsContent value="week1">
              <WeekTable week="week1" />
            </TabsContent>
            <TabsContent value="week2">
              <WeekTable week="week2" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riepilogo Sprint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {chartData.map(({ name, hours, storyPoints }) => (
                  <div key={name} className="p-2 border rounded space-y-1">
                    <div className="font-medium">{name}</div>
                    <div className="flex justify-between text-sm">
                      <span>Ore:</span>
                      <span>{hours.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Story Points:</span>
                      <span>{storyPoints}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-medium">Totale Sprint</div>
                <div className="flex justify-between mt-2">
                  <span>Ore Totali:</span>
                  <span>{Object.values(projectHours).reduce((a, b) => a + b, 0).toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Story Points Totali:</span>
                  <span>{totalStoryPoints}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Sprint Time Tracker</h1>
            <div className="space-x-4">
              <Button variant="ghost">Documentazione</Button>
              <Button variant="ghost">Contatti</Button>
              <Button>Inizia Ora</Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Gestisci il Tuo Tempo in Modo Efficiente
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Organizza e monitora le tue attività sprint per sprint. 
            Visualizza statistiche dettagliate e ottimizza il tuo workflow.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <TimeTrackerComponent />
      </main>

      {/* Footer */}
      <footer className="bg-white mt-16 border-t">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>© 2024 Sprint Time Tracker. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;