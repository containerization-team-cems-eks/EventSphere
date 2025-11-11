import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import './AdminEvents.css';

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'conference',
    venue: '',
    date: '',
    time: '',
    capacity: '',
    price: '',
    organizer: '',
    imageUrl: ''
  });
  const createEmptyScheduleForm = () => ({
    title: '',
    description: '',
    speaker: '',
    location: '',
    startTime: '',
    endTime: ''
  });
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [schedules, setSchedules] = useState({});
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState(() => createEmptyScheduleForm());
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.event}/events`);
      setEvents(response.data.events);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchSchedules = async (eventId) => {
    try {
      setLoadingSchedules(true);
      const response = await axios.get(`${API_CONFIG.event}/schedules`, {
        params: { eventId }
      });
      setSchedules((prev) => ({
        ...prev,
        [eventId]: response.data
      }));
    } catch (err) {
      console.error('Error fetching schedules:', err);
      alert('Failed to load schedules. Please try again.');
    } finally {
      setLoadingSchedules(false);
    }
  };

  const toDateTimeLocalValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const tzOffset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - tzOffset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const resetScheduleForm = () => {
    setScheduleFormData(createEmptyScheduleForm());
    setEditingScheduleId(null);
  };

  const toggleSchedulePanel = async (eventId) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
      resetScheduleForm();
      return;
    }

    await fetchSchedules(eventId);
    setExpandedEventId(eventId);
    resetScheduleForm();
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    if (!expandedEventId) {
      alert('Please select an event to manage schedules.');
      return;
    }

    if (!scheduleFormData.startTime || !scheduleFormData.endTime) {
      alert('Start and end time are required.');
      return;
    }

    if (new Date(scheduleFormData.endTime) <= new Date(scheduleFormData.startTime)) {
      alert('End time must be after the start time.');
      return;
    }

    try {
      setSavingSchedule(true);
      const token = localStorage.getItem('token');
      const payload = {
        title: scheduleFormData.title,
        description: scheduleFormData.description,
        speaker: scheduleFormData.speaker,
        location: scheduleFormData.location,
        startTime: new Date(scheduleFormData.startTime).toISOString(),
        endTime: new Date(scheduleFormData.endTime).toISOString(),
        eventId: expandedEventId
      };

      if (editingScheduleId) {
        await axios.put(
          `${API_CONFIG.event}/schedules/${editingScheduleId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Schedule updated successfully!');
      } else {
        await axios.post(
          `${API_CONFIG.event}/schedules`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Schedule created successfully!');
      }

      resetScheduleForm();
      await fetchSchedules(expandedEventId);
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert(err.response?.data?.error || 'Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleScheduleEdit = (eventId, schedule) => {
    setExpandedEventId(eventId);
    setEditingScheduleId(schedule._id);
    setScheduleFormData({
      title: schedule.title || '',
      description: schedule.description || '',
      speaker: schedule.speaker || '',
      location: schedule.location || '',
      startTime: toDateTimeLocalValue(schedule.startTime),
      endTime: toDateTimeLocalValue(schedule.endTime)
    });
  };

  const handleScheduleDelete = async (scheduleId) => {
    if (!expandedEventId) return;

    if (!window.confirm('Delete this schedule item?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_CONFIG.event}/schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Schedule deleted successfully.');
      await fetchSchedules(expandedEventId);
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('Failed to delete schedule');
    }
  };

  const formatScheduleRange = (schedule) => {
    const start = new Date(schedule.startTime).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    const end = new Date(schedule.endTime).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    return `${start} - ${end}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_CONFIG.event}/events`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Event created successfully!');
      setShowForm(false);
      fetchEvents();
      setFormData({
        title: '',
        description: '',
        category: 'conference',
        venue: '',
        date: '',
        time: '',
        capacity: '',
        price: '',
        organizer: '',
        imageUrl: ''
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_CONFIG.event}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Event deleted!');
      fetchEvents();
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  return (
    <div className="admin-events">
      <div className="admin-header">
        <h1>Manage Events</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Create Event'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="event-form">
          <input
            type="text"
            placeholder="Event Title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="conference">Conference</option>
            <option value="workshop">Workshop</option>
            <option value="seminar">Seminar</option>
            <option value="concert">Concert</option>
            <option value="sports">Sports</option>
            <option value="festival">Festival</option>
          </select>
          <input
            type="text"
            placeholder="Venue"
            value={formData.venue}
            onChange={(e) => setFormData({...formData, venue: e.target.value})}
            required
          />
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Time (e.g., 9:00 AM - 5:00 PM)"
            value={formData.time}
            onChange={(e) => setFormData({...formData, time: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Organizer"
            value={formData.organizer}
            onChange={(e) => setFormData({...formData, organizer: e.target.value})}
            required
          />
          <input
            type="url"
            placeholder="Image URL (optional)"
            value={formData.imageUrl}
            onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
          />
          <small style={{color: '#666', marginTop: '-5px', display: 'block'}}>
            Example: https://images.unsplash.com/photo-1540575467063-178a50c2df87
          </small>
          <button type="submit" className="btn btn-success">Create Event</button>
        </form>
      )}

      <div className="events-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Venue</th>
              <th>Capacity</th>
              <th>Available</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event._id}>
                <td>{event.title}</td>
                <td>{new Date(event.date).toLocaleDateString()}</td>
                <td>{event.venue}</td>
                <td>{event.capacity}</td>
                <td>{event.availableSeats}</td>
                <td>₹{event.price}</td>
                <td className="action-buttons">
                  <button
                    onClick={() => toggleSchedulePanel(event._id)}
                    className="btn btn-secondary btn-sm"
                    type="button"
                  >
                    {expandedEventId === event._id ? 'Hide Schedules' : 'Manage Schedules'}
                  </button>
                  <button
                    onClick={() => handleDelete(event._id)}
                    className="btn btn-danger btn-sm"
                    type="button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
              {expandedEventId === event._id && (
                <tr className="schedule-row">
                  <td colSpan="7">
                    <div className="schedule-panel">
                      <h3>Schedules for {event.title}</h3>
                      {loadingSchedules ? (
                        <p>Loading schedules...</p>
                      ) : (
                        <>
                          {schedules[event._id] && schedules[event._id].length > 0 ? (
                            <ul className="schedule-list">
                              {schedules[event._id].map((schedule) => (
                                <li key={schedule._id} className="schedule-item">
                                  <div className="schedule-item-header">
                                    <div>
                                      <strong>{schedule.title}</strong>
                                      <div className="schedule-range">{formatScheduleRange(schedule)}</div>
                                    </div>
                                    <div className="schedule-actions">
                                      <button
                                        type="button"
                                        className="btn btn-light btn-sm"
                                        onClick={() => handleScheduleEdit(event._id, schedule)}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleScheduleDelete(schedule._id)}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                  {(schedule.speaker || schedule.location || schedule.description) && (
                                    <div className="schedule-details">
                                      {schedule.speaker && (
                                        <p><strong>Speaker:</strong> {schedule.speaker}</p>
                                      )}
                                      {schedule.location && (
                                        <p><strong>Location:</strong> {schedule.location}</p>
                                      )}
                                      {schedule.description && (
                                        <p className="schedule-description">{schedule.description}</p>
                                      )}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="empty-state">No schedules yet. Create one below.</p>
                          )}
                        </>
                      )}

                      <form onSubmit={handleScheduleSubmit} className="schedule-form">
                        <h4>{editingScheduleId ? 'Edit schedule item' : 'Add a schedule item'}</h4>
                        <input
                          type="text"
                          placeholder="Session title"
                          value={scheduleFormData.title}
                          onChange={(e) => setScheduleFormData({ ...scheduleFormData, title: e.target.value })}
                          required
                        />
                        <textarea
                          placeholder="Description (optional)"
                          value={scheduleFormData.description}
                          onChange={(e) => setScheduleFormData({ ...scheduleFormData, description: e.target.value })}
                        />
                        <div className="schedule-form-grid">
                          <input
                            type="text"
                            placeholder="Speaker (optional)"
                            value={scheduleFormData.speaker}
                            onChange={(e) => setScheduleFormData({ ...scheduleFormData, speaker: e.target.value })}
                          />
                          <input
                            type="text"
                            placeholder="Location (optional)"
                            value={scheduleFormData.location}
                            onChange={(e) => setScheduleFormData({ ...scheduleFormData, location: e.target.value })}
                          />
                        </div>
                        <div className="schedule-form-grid">
                          <label className="field-label">
                            <span>Start time</span>
                            <input
                              type="datetime-local"
                              value={scheduleFormData.startTime}
                              onChange={(e) => setScheduleFormData({ ...scheduleFormData, startTime: e.target.value })}
                              required
                            />
                          </label>
                          <label className="field-label">
                            <span>End time</span>
                            <input
                              type="datetime-local"
                              value={scheduleFormData.endTime}
                              onChange={(e) => setScheduleFormData({ ...scheduleFormData, endTime: e.target.value })}
                              required
                            />
                          </label>
                        </div>
                        <div className="schedule-form-actions">
                          <button type="submit" className="btn btn-success" disabled={savingSchedule}>
                            {savingSchedule ? 'Saving…' : editingScheduleId ? 'Update Schedule' : 'Create Schedule'}
                          </button>
                          {editingScheduleId && (
                            <button
                              type="button"
                              className="btn btn-light"
                              onClick={resetScheduleForm}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </td>
                </tr>
              )}
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminEvents;
