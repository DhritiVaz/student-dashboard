import { useState } from 'react'
import { useData } from '../context/DataContext'
import { BookOpen, AlertCircle, Clock, CheckCircle, TrendingUp, Calendar as CalendarIcon, FileText, Plus } from 'lucide-react'
import './Dashboard.css'

const Dashboard = () => {
    const { courses, timetable, mindSpaceItems, grades } = useData()

    // Derived values (will be 0 or empty if no data)
    const pendingTasks = mindSpaceItems.filter(i => !i.completed).length
    const completedCredits = courses.length * 3 // Assumption for purely visual demo without real credits data

    // Empty state helpers
    const hasCourses = courses.length > 0
    const hasTasks = pendingTasks > 0

    // Placeholder for CGPA/Attendance since they don't have real logic yet
    // Show empty state "—" instead of fake numbers
    const cgpa = grades.length > 0 ? "3.5" : "—" // Mock logic for now, but better than hardcoded "3.8"
    const attendance = "—" // No attendance data in context yet

    // Chart Data - Empty by default
    const chartData = []

    // --- Event Logic ---
    const [showEventModal, setShowEventModal] = useState(false)
    const [eventForm, setEventForm] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        type: 'personal', // personal, assignment, exam
        description: ''
    })

    const { calendarEvents, addCalendarEvent } = useData()

    // Filter for upcoming events (today or future)
    const upcomingEvents = calendarEvents
        .filter(e => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
        .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')))
        .slice(0, 5)

    const handleEventSubmit = (e) => {
        e.preventDefault()
        addCalendarEvent(eventForm)
        setShowEventModal(false)
        setEventForm({
            title: '',
            date: new Date().toISOString().split('T')[0],
            time: '',
            type: 'personal',
            description: ''
        })
    }

    return (
        <section className="dashboard">
            {/* Section 1: Summary Cards */}
            <section className="stats-cards">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">CGPA</span>
                    </div>
                    <div className="stat-value">{cgpa}</div>
                    <div className="stat-meta text-neutral">No recent updates</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Attendance</span>
                    </div>
                    <div className="stat-value">{attendance}</div>
                    <div className="stat-meta text-neutral">Not tracked</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Credits</span>
                    </div>
                    <div className="stat-value">{completedCredits || "—"}</div>
                    <div className="stat-meta text-neutral">Based on courses</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Pending</span>
                    </div>
                    <div className="stat-value">{pendingTasks}</div>
                    <div className="stat-meta text-neutral">Active tasks</div>
                </div>
            </section>

            {/* Section 2: Primary Visual Area */}
            <section className="main-row">
                <div className="timetable-preview-card">
                    <div className="card-header">
                        <h3>Today's Classes</h3>
                        <span className="text-muted text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
                    </div>
                    <div className="timetable-list">
                        {/* Logic to get today's classes */}
                        {(() => {
                            const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
                            const todayClasses = timetable[todayKey] || []

                            if (todayClasses.length === 0) {
                                return (
                                    <div className="empty-state-small">
                                        <Clock size={24} className="text-muted" />
                                        <p>Enjoy your free day!</p>
                                    </div>
                                )
                            }

                            return todayClasses.sort((a, b) => a.period - b.period).map(cls => {
                                const course = courses.find(c => c.id === cls.courseId)
                                if (!course) return null
                                return (
                                    <div key={cls.period} className="timetable-row-preview">
                                        <div className="time-col-preview">
                                            <span className="time-text">{cls.startTime || "TBA"}</span>
                                        </div>
                                        <div className="info-col-preview">
                                            <span className="subject-text">{course.courseName}</span>
                                            <div className="meta-row">
                                                <span className="venue-text">{course.venue || "No Venue"}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        })()}
                    </div>
                </div>

                <div className="calendar-card">
                    <div className="card-header">
                        <h3>Upcoming</h3>
                        <button
                            className="icon-btn-sm"
                            aria-label="Add Event"
                            onClick={() => setShowEventModal(true)}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="mini-events">
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.map(event => (
                                <div key={event.id} className="mini-event-row">
                                    <div className="event-date-badge">
                                        <span className="day">{new Date(event.date).getDate()}</span>
                                        <span className="month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                    </div>
                                    <div className="event-info">
                                        <span className="event-title">{event.title}</span>
                                        <span className="event-time text-muted">
                                            {event.time ? new Date(`2000-01-01T${event.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'All Day'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state-small">
                                <CalendarIcon size={24} className="text-muted" />
                                <p>No upcoming events</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Section 3 & 4: Secondary + Table */}
            <div className="bottom-grid">
                <section className="info-card">
                    <div className="card-header">
                        <h3>Study Progress</h3>
                    </div>
                    <div className="progress-list">
                        {hasCourses ? (
                            courses.slice(0, 3).map(c => (
                                <div key={c.id} className="progress-item">
                                    <div className="progress-info">
                                        <span>{c.courseCode || "Course"}</span>
                                        <span>0%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ width: '0%' }}></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state-small">
                                <p>No courses enrolled</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="activity-table-section">
                    <div className="card-header">
                        <h3>Recent Files</h3>
                    </div>
                    <div className="table-wrapper">
                        <table className="clean-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Size</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Empty State Row */}
                                <tr className="empty-row">
                                    <td colSpan="4" className="text-center">No recent files found</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Add Event Modal */}
            {showEventModal && (
                <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Event</h2>
                            <button className="icon-btn" onClick={() => setShowEventModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleEventSubmit}>
                            <div className="form-group">
                                <label>Event Name</label>
                                <input
                                    type="text"
                                    required
                                    value={eventForm.title}
                                    onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                    placeholder="e.g. Project Submission"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={eventForm.date}
                                        onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Time</label>
                                    <input
                                        type="time"
                                        value={eventForm.time}
                                        onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notes (Optional)</label>
                                <textarea
                                    rows="3"
                                    value={eventForm.description}
                                    onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                                    placeholder="Add any relevant details..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Add Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

export default Dashboard
