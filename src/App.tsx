import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem
} from '@mui/material';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  category: string;
}
const categoryStyles: Record<string, { backgroundColor: string; textColor: string }> = {
  todo: { backgroundColor: '#fef3c7', textColor: '#92400e' },        // Yellow
  inprogress: { backgroundColor: '#dbeafe', textColor: '#1e3a8a' },  // Blue
  review: { backgroundColor: '#ede9fe', textColor: '#6b21a8' },      // Purple
  completed: { backgroundColor: '#dcfce7', textColor: '#166534' }    // Green
};


export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const storedEvents = localStorage.getItem('calendarEvents');
    return storedEvents ? JSON.parse(storedEvents) : [];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'todo'
  });
  const [dateRange, setDateRange] = useState<{ start: string; end?: string }>({ start: '' });



  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const handleDateSelect = (selectInfo: { startStr: any; endStr: any; }) => {
    setFormData({ title: '', category: 'todo' });
    setDateRange({ start: selectInfo.startStr, end: selectInfo.endStr || undefined });
    setSelectedEvent(null);
    setOpen(true);
  };

  const handleEventClick = (clickInfo: { event: { id: string; }; }) => {
    const event = events.find((ev) => ev.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setFormData({ title: event.title, category: event.category });
      setDateRange({ start: event.start, end: event.end });
      setOpen(true);
    }
  };

  const handleSave = () => {
    if (selectedEvent) {
      // Update existing event
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === selectedEvent.id
            ? {
              ...ev,
              title: formData.title,
              category: formData.category,
              start: dateRange.start,
              end: dateRange.end
            }
            : ev
        )
      );
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        id: String(Date.now()),
        title: formData.title,
        category: formData.category,
        start: dateRange.start,
        end: dateRange.end
      };
      setEvents((prev) => [...prev, newEvent]);
    }
    setOpen(false);
  };

  const handleDelete = () => {
    if (selectedEvent) {
      setEvents((prev) => prev.filter((ev) => ev.id !== selectedEvent.id));
    }
    setOpen(false);
  };

  const handleEventChange = (changeInfo: { event: { id: string; startStr: any; endStr: any; }; }) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === changeInfo.event.id
          ? {
            ...ev,
            start: changeInfo.event.startStr,
            end: changeInfo.event.endStr || undefined
          }
          : ev
      )
    );
  };
  const filteredEvents = events.filter(event => {
    const category = event.category || '';
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? category === categoryFilter : true;

    let matchesTime = true;
    if (timeFilter) {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end || event.start); // fallback if no end date

      // Calculate the difference between start and end dates
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (timeFilter === '1week') matchesTime = diffDays <= 7;
      if (timeFilter === '2weeks') matchesTime = diffDays <= 14;
      if (timeFilter === '3weeks') matchesTime = diffDays <= 21;
    }

    return matchesSearch && matchesCategory && matchesTime;
  });



  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='rounded'
          style={{ padding: '5px', flex: 1, border: '1px solid #fff' }}
        />

        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="todo" className="bg-yellow-100 text-yellow-800">To Do</option>
            <option value="inprogress" className="bg-blue-100 text-blue-800">In Progress</option>
            <option value="review" className="bg-purple-100 text-purple-800">Review</option>
            <option value="completed" className="bg-green-100 text-green-800">Completed</option>
          </select>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Time</option>
            <option value="1week" className="bg-red-100 text-red-800">Within 1 Week</option>
            <option value="2weeks" className="bg-orange-100 text-orange-800">Within 2 Weeks</option>
            <option value="3weeks" className="bg-pink-100 text-pink-800">Within 3 Weeks</option>
          </select>
        </div>


      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable={true}
        editable={true}
        eventResizableFromStart={true}
        dragRevertDuration={0}
        events={filteredEvents}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventChange={handleEventChange}
        eventContent={(arg) => {
          const category = arg.event.extendedProps.category;
          const style = categoryStyles[category] || { backgroundColor: '#f3f4f6', textColor: '#111827' };
          return {
            html: `<div style="
        background-color: ${style.backgroundColor};
        color: ${style.textColor};
        padding: 2px 4px;
        border-radius: 4px;
        font-size: 0.85rem;
      ">${arg.event.title}</div>`
          };
        }}
        eventDragStart={(info) => { info.el.style.opacity = '0.7'; }}
        eventDragStop={(info) => { info.el.style.opacity = '1'; }}
        eventResizeStart={(info) => { info.el.style.opacity = '0.7'; }}
        eventResizeStop={(info) => { info.el.style.opacity = '1'; }}
      />




      {/* Popup Form */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{selectedEvent ? 'Edit Task' : 'Add Task'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
            margin="dense"
          />
          <TextField
            select
            fullWidth
            label="Category"
            value={formData.category}
            onChange={(e: { target: { value: any; }; }) => setFormData({ ...formData, category: e.target.value })}
            margin="dense"
          >
            <MenuItem value="todo">Todo</MenuItem>
            <MenuItem value="in progress">In Progress</MenuItem>
            <MenuItem value="review">Review</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          {selectedEvent && (
            <Button color="error" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
