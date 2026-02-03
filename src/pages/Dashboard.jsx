import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useSemester } from '../context/SemesterContext'
import {
  BookOpen, Clock, CheckCircle, TrendingUp, Calendar as CalendarIcon,
  Plus, X, Target, Zap, ArrowUpRight, ChevronRight, Layers, Edit2
} from 'lucide-react'
import PropertyFormFields from '../components/PropertyFormFields'
import './Dashboard.css'

const gradePoints = {
  S: 10.0, A: 9.0, B: 8.0, C: 7.0, D: 6.0, E: 5.0
}

const eventTypeColors = {
  assignment: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  exam: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  quiz: { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' },
  presentation: { bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' },
  personal: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' }
}

const Dashboard = () => {
  const {
    courses,
    timetable,
    mindSpaceItems,
    grades,
    calendarEvents,
    semesters,
    addCalendarEvent,
    addSemester,
    updateSemester,
    getCourseById,
    getCourseDisplayName,
    getCourseProperty,
    getSemesterById,
    getPropertyDefinitions
  } = useData()
  const { selectedSemesterId, setSelectedSemesterId, isViewingAll } = useSemester()

  const [showSemesterModal, setShowSemesterModal] = useState(false)
  const [editingSemester, setEditingSemester] = useState(null)
  const [semesterForm, setSemesterForm] = useState({ name: '' })

  const resetSemesterForm = () => {
    setSemesterForm({ name: '' })
    setEditingSemester(null)
  }

  const handleSemesterSubmit = (e) => {
    e.preventDefault()
    const name = semesterForm.name.trim()
    if (!name) return
    if (editingSemester) {
      updateSemester(editingSemester.id, { name })
    } else {
      addSemester({ name })
    }
    resetSemesterForm()
    setShowSemesterModal(false)
  }

  const selectedSemester = selectedSemesterId ? getSemesterById(selectedSemesterId) : null

  const coursesInScope = isViewingAll
    ? courses
    : courses.filter((c) => c.semesterId === selectedSemesterId)
  const eventsInScope = isViewingAll
    ? calendarEvents
    : calendarEvents.filter(
        (e) =>
          e.semesterId === selectedSemesterId ||
          (e.courseId && getCourseById(e.courseId)?.semesterId === selectedSemesterId)
      )
  const gradesInScope = isViewingAll
    ? grades
    : grades.filter((g) => selectedSemester && g.semester === selectedSemester.name)
  const courseIdsInScope = new Set(coursesInScope.map((c) => c.id))
  const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const todayClassesRaw = timetable[todayKey] || []
  const todayClasses = todayClassesRaw
    .filter((cls) => courseIdsInScope.has(cls.courseId))
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

  const upcomingEvents = eventsInScope
    .filter((e) => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')))
    .slice(0, 8)

  const calculateCGPA = (gradeList) => {
    if (!gradeList.length) return '0.00'
    let totalPoints = 0
    let totalCredits = 0
    gradeList.forEach((grade) => {
      const points = gradePoints[grade.grade] || 0
      const credits = parseFloat(grade.credits) || 0
      totalPoints += points * credits
      totalCredits += credits
    })
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'
  }

  const cgpaAll = calculateCGPA(grades)
  const cgpaScope = calculateCGPA(gradesInScope)
  const totalCreditsScope = coursesInScope.reduce(
    (acc, c) => acc + (parseFloat(getCourseProperty(c, 'Credits')) || 0),
    0
  )
  const pendingTasks = mindSpaceItems.filter((i) => !i.completed).length
  const completedTasks = mindSpaceItems.filter((i) => i.completed).length

  const [showEventModal, setShowEventModal] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    type: 'personal',
    description: '',
    semesterId: selectedSemesterId || '',
    properties: {}
  })
  const eventDefs = getPropertyDefinitions('calendar_events')

  const openEventModal = () => {
    setEventForm((prev) => ({
      ...prev,
      semesterId: selectedSemesterId || ''
    }))
    setShowEventModal(true)
  }

  const handleEventSubmit = (e) => {
    e.preventDefault()
    addCalendarEvent({
      ...eventForm,
      semesterId: eventForm.semesterId || null
    })
    setShowEventModal(false)
    setEventForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      type: 'personal',
      description: '',
      semesterId: selectedSemesterId || '',
      properties: {}
    })
  }

  return (
    <div className="dashboard">
      {isViewingAll ? (
        <>
          <section className="dashboard-section">
            <h2 className="dashboard-section-title">
              <Layers size={20} />
              Your semesters
            </h2>
            <p className="dashboard-section-desc">
              Select a semester in the sidebar to see only that semester&apos;s courses, events, and grades.
            </p>
            <div className="semester-cards-grid">
              {semesters.map((sem) => {
                const semCourses = courses.filter((c) => c.semesterId === sem.id)
                const semEvents = calendarEvents.filter(
                  (e) =>
                    e.semesterId === sem.id ||
                    (e.courseId && getCourseById(e.courseId)?.semesterId === sem.id)
                )
                const semGrades = grades.filter((g) => g.semester === sem.name)
                return (
                  <div key={sem.id} className="semester-card">
                    <div className="semester-card-header">
                      <h3 className="semester-card-name">{sem.name}</h3>
                      <div className="semester-card-actions">
                        <button
                          type="button"
                          className="semester-card-icon-btn"
                          onClick={() => {
                            setEditingSemester(sem)
                            setSemesterForm({ name: sem.name })
                            setShowSemesterModal(true)
                          }}
                          title="Edit semester"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="semester-card-view"
                          onClick={() => setSelectedSemesterId(sem.id)}
                        >
                          View <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="semester-card-stats">
                      <span>{semCourses.length} courses</span>
                      <span>{semEvents.length} events</span>
                      <span>{semGrades.length} grades</span>
                    </div>
                  </div>
                )
              })}
              <button
                type="button"
                className="semester-card semester-card-add"
                onClick={() => {
                  resetSemesterForm()
                  setShowSemesterModal(true)
                }}
              >
                <Plus size={28} />
                <span>Add semester</span>
              </button>
            </div>
          </section>

          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Across all semesters</h2>
            <div className="stats-grid">
              <div className="stat-card stat-cgpa">
                <div className="stat-icon-wrap">
                  <TrendingUp size={22} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">CGPA</span>
                  <span className="stat-value">{cgpaAll}</span>
                  <span className="stat-meta">Based on {grades.length} grades</span>
                </div>
                <div className="stat-glow stat-glow-blue" />
              </div>
              <div className="stat-card stat-courses">
                <div className="stat-icon-wrap purple">
                  <BookOpen size={22} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total courses</span>
                  <span className="stat-value">{courses.length}</span>
                  <span className="stat-meta">{semesters.length} semesters</span>
                </div>
                <div className="stat-glow stat-glow-purple" />
              </div>
              <div className="stat-card stat-tasks">
                <div className="stat-icon-wrap cyan">
                  <Target size={22} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Pending tasks</span>
                  <span className="stat-value">{pendingTasks}</span>
                  <span className="stat-meta">{completedTasks} completed</span>
                </div>
                <div className="stat-glow stat-glow-cyan" />
              </div>
              <div className="stat-card stat-events">
                <div className="stat-icon-wrap green">
                  <Zap size={22} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Upcoming events</span>
                  <span className="stat-value">{calendarEvents.filter((e) => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0))).length}</span>
                  <span className="stat-meta">Across all</span>
                </div>
                <div className="stat-glow stat-glow-green" />
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="dashboard-section">
          <h2 className="dashboard-section-title semester-view-title">
            {selectedSemester?.name ?? 'Semester'}
          </h2>
          <p className="dashboard-section-desc">
            Courses, schedule, events, and grades for this semester only.
          </p>
          <div className="stats-grid">
            <div className="stat-card stat-cgpa">
              <div className="stat-icon-wrap">
                <TrendingUp size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Semester GPA</span>
                <span className="stat-value">{cgpaScope}</span>
                <span className="stat-meta">{gradesInScope.length} grades</span>
              </div>
              <div className="stat-glow stat-glow-blue" />
            </div>
            <div className="stat-card stat-courses">
              <div className="stat-icon-wrap purple">
                <BookOpen size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Courses</span>
                <span className="stat-value">{coursesInScope.length}</span>
                <span className="stat-meta">{totalCreditsScope} credits</span>
              </div>
              <div className="stat-glow stat-glow-purple" />
            </div>
            <div className="stat-card stat-tasks">
              <div className="stat-icon-wrap cyan">
                <Target size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Pending tasks</span>
                <span className="stat-value">{pendingTasks}</span>
                <span className="stat-meta">(global)</span>
              </div>
              <div className="stat-glow stat-glow-cyan" />
            </div>
            <div className="stat-card stat-events">
              <div className="stat-icon-wrap green">
                <Zap size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Upcoming</span>
                <span className="stat-value">{upcomingEvents.length}</span>
                <span className="stat-meta">this semester</span>
              </div>
              <div className="stat-glow stat-glow-green" />
            </div>
          </div>
        </section>
      )}

      <div className="dashboard-grid">
        <section className="dashboard-card schedule-card">
          <div className="card-header">
            <div className="card-title-group">
              <Clock size={18} className="card-icon" />
              <h3>Today&apos;s schedule</h3>
            </div>
            <span className="day-badge">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
          </div>
          <div className="schedule-list">
            {todayClasses.length > 0 ? (
              todayClasses.map((cls, idx) => {
                const course = getCourseById(cls.courseId)
                if (!course) return null
                return (
                  <div key={cls.period} className="schedule-item" style={{ '--delay': `${idx * 0.1}s` }}>
                    <div className="schedule-time">
                      <span className="time-start">{cls.startTime}</span>
                      <span className="time-end">{cls.endTime}</span>
                    </div>
                    <div className="schedule-divider" style={{ background: course.color }} />
                    <div className="schedule-info">
                      <span className="schedule-course">{getCourseDisplayName(course)}</span>
                      <div className="schedule-meta">
                        <span className="schedule-code">{getCourseProperty(course, 'Course Code')}</span>
                        <span className="schedule-venue">{cls.venue || getCourseProperty(course, 'Venue')}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state-small">
                <Clock size={32} className="text-muted" />
                <p>{isViewingAll ? 'No classes today' : 'No classes today in this semester'}</p>
                <span className="text-muted">Enjoy your free day</span>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-card events-card">
          <div className="card-header">
            <div className="card-title-group">
              <CalendarIcon size={18} className="card-icon" />
              <h3>Upcoming events</h3>
            </div>
            <button type="button" className="add-btn" onClick={openEventModal}>
              <Plus size={16} />
            </button>
          </div>
          <div className="events-list">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, idx) => {
                const eventStyle = eventTypeColors[event.type] || eventTypeColors.personal
                const eventDate = new Date(event.date)
                return (
                  <div key={event.id} className="event-item" style={{ '--delay': `${idx * 0.1}s` }}>
                    <div className="event-date-badge">
                      <span className="event-day">{eventDate.getDate()}</span>
                      <span className="event-month">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </div>
                    <div className="event-content">
                      <span className="event-title">{event.title}</span>
                      <div className="event-meta">
                        <span
                          className="event-type-badge"
                          style={{
                            background: eventStyle.bg,
                            color: eventStyle.color,
                            borderColor: eventStyle.border
                          }}
                        >
                          {event.type}
                        </span>
                        {event.time && (
                          <span className="event-time">
                            {new Date(`2000-01-01T${event.time}`).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="event-arrow" />
                  </div>
                )
              })
            ) : (
              <div className="empty-state-small">
                <CalendarIcon size={32} className="text-muted" />
                <p>No upcoming events</p>
                <button type="button" className="btn-text-action" onClick={openEventModal}>
                  + Add Event
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-card progress-card">
          <div className="card-header">
            <div className="card-title-group">
              <BookOpen size={18} className="card-icon" />
              <h3>Course progress</h3>
            </div>
            <Link to="/courses" className="view-all-link">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="progress-list">
            {coursesInScope.slice(0, 8).map((course, idx) => (
              <div key={course.id} className="progress-item" style={{ '--delay': `${idx * 0.1}s` }}>
                <div className="progress-header">
                  <div className="progress-course">
                    <span className="progress-code" style={{ color: course.color }}>
                      {getCourseProperty(course, 'Course Code')}
                    </span>
                    <span className="progress-name">{getCourseDisplayName(course)}</span>
                  </div>
                  <span className="progress-percent">{course.progress || 0}%</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${course.progress || 0}%`, background: course.color }}
                  />
                </div>
              </div>
            ))}
            {coursesInScope.length === 0 && (
              <div className="empty-state-small">
                <BookOpen size={32} className="text-muted" />
                <p>No courses in this view</p>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-card tasks-card">
          <div className="card-header">
            <div className="card-title-group">
              <CheckCircle size={18} className="card-icon" />
              <h3>Recent tasks</h3>
            </div>
            <Link to="/mindspace" className="view-all-link">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="tasks-list">
            {mindSpaceItems
              .filter((t) => !t.completed)
              .slice(0, 8)
              .map((task, idx) => (
                <div
                  key={task.id}
                  className={`task-item ${task.completed ? 'completed' : ''}`}
                  style={{ '--delay': `${idx * 0.1}s` }}
                >
                  <div className={`task-checkbox ${task.completed ? 'checked' : ''}`}>
                    {task.completed && <CheckCircle size={14} />}
                  </div>
                  <div className="task-content">
                    <span className="task-title">{task.title}</span>
                    {task.content && (
                      <span className="task-desc">{task.content.substring(0, 50)}...</span>
                    )}
                  </div>
                  {task.priority && (
                    <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                  )}
                </div>
              ))}
          </div>
        </section>
      </div>

      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Event</h2>
              <button type="button" className="icon-btn" onClick={() => setShowEventModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEventSubmit}>
              <div className="form-group">
                <label>Event Name</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. Project Submission"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                >
                  <option value="personal">Personal</option>
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="quiz">Quiz</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>
              <div className="form-group">
                <label>Semester (optional)</label>
                <select
                  value={eventForm.semesterId}
                  onChange={(e) => setEventForm({ ...eventForm, semesterId: e.target.value })}
                >
                  <option value="">None</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  rows="3"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Add any relevant details..."
                />
              </div>
              <PropertyFormFields
                entityType="calendar_events"
                definitions={eventDefs}
                values={eventForm.properties}
                onChange={(properties) => setEventForm({ ...eventForm, properties })}
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEventModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSemesterModal && (
        <div className="modal-overlay" onClick={() => { setShowSemesterModal(false); resetSemesterForm() }}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSemester ? 'Edit Semester' : 'Add Semester'}</h2>
              <button type="button" className="icon-btn" onClick={() => { setShowSemesterModal(false); resetSemesterForm() }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSemesterSubmit}>
              <div className="form-group">
                <label>Semester name *</label>
                <input
                  type="text"
                  value={semesterForm.name}
                  onChange={(e) => setSemesterForm({ name: e.target.value })}
                  placeholder="e.g. Fall 2025"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowSemesterModal(false); resetSemesterForm() }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSemester ? 'Update' : 'Add'} Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
