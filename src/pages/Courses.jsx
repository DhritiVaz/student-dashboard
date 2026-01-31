import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useSemester } from '../context/SemesterContext'
import { Plus, Edit2, Trash2, X, List, Grid, BookOpen, Settings2, Layers } from 'lucide-react'
import PropertyFormFields from '../components/PropertyFormFields'
import PropertyManager from '../components/PropertyManager'
import './Courses.css'

const Courses = () => {
  const {
    courses,
    semesters,
    addCourse,
    updateCourse,
    deleteCourse,
    getSemesterById,
    getPropertyDefinitions,
    addPropertyDefinition,
    deletePropertyDefinition,
    getCourseDisplayName,
    getCourseProperty,
    files
  } = useData()
  const { selectedSemesterId, setSelectedSemesterId, isViewingAll } = useSemester()

  const [viewMode, setViewMode] = useState('card')
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showPropertyManager, setShowPropertyManager] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)

  const courseDefs = getPropertyDefinitions('courses')
  const coursesInView = isViewingAll
    ? courses
    : courses.filter((c) => c.semesterId === selectedSemesterId)

  const coursesBySemester = semesters.map((sem) => ({
    semester: sem,
    courses: courses.filter((c) => c.semesterId === sem.id)
  })).filter((g) => g.courses.length > 0)
  const unassignedCourses = courses.filter((c) => !c.semesterId)
  const showGroupedBySemester = isViewingAll && (coursesBySemester.length > 0 || unassignedCourses.length > 0)

  const [courseForm, setCourseForm] = useState({ name: '', semesterId: '', properties: {} })

  const getCourseFiles = (courseId) => files.filter((f) => f.courseId === courseId)

  const resetCourseForm = () => {
    setCourseForm({ name: '', semesterId: selectedSemesterId ?? '', properties: {} })
    setEditingCourse(null)
  }

  const openCourseModalWithSemester = (semId) => {
    setCourseForm({ name: '', semesterId: semId ?? '', properties: {} })
    setEditingCourse(null)
    setShowCourseModal(true)
  }

  const handleCourseSubmit = (e) => {
    e.preventDefault()
    if (editingCourse) {
      updateCourse(editingCourse.id, {
        name: courseForm.name,
        semesterId: courseForm.semesterId || null,
        properties: courseForm.properties
      })
    } else {
      addCourse({
        name: courseForm.name,
        semesterId: courseForm.semesterId || null,
        properties: courseForm.properties
      })
    }
    resetCourseForm()
    setShowCourseModal(false)
  }

  const handleEditCourse = (course) => {
    setEditingCourse(course)
    setCourseForm({
      name: getCourseDisplayName(course),
      semesterId: course.semesterId ?? '',
      properties: { ...(course.properties || {}) }
    })
    setShowCourseModal(true)
  }

  const handleDeleteCourse = (id) => {
    if (confirm('Are you sure you want to delete this course?')) deleteCourse(id)
  }

  const renderListView = () => (
    <div className="courses-list fade-in">
      <div className="list-header">
        <span className="col-name">Name</span>
        {courseDefs.slice(0, 3).map((def) => (
          <span key={def.id} className="col-detail">
            {def.name}
          </span>
        ))}
        <span className="col-progress">Progress</span>
        <span className="col-actions">Actions</span>
      </div>
      <div className="list-body">
        {coursesInView.map((course, idx) => (
          <div
            key={course.id}
            className="list-row"
            style={{ '--delay': `${idx * 0.05}s` }}
          >
            <div className="col-name">
              <span className="course-name">{getCourseDisplayName(course)}</span>
            </div>
            {courseDefs.slice(0, 3).map((def) => (
              <div key={def.id} className="col-detail">
                <span className="detail-value">{getCourseProperty(course, def.name)}</span>
              </div>
            ))}
            <div className="col-progress">
              <div className="mini-progress">
                <div
                  className="mini-progress-fill"
                  style={{ width: `${course.progress || 0}%`, background: course.color }}
                />
              </div>
              <span className="progress-text">{course.progress || 0}%</span>
            </div>
            <div className="col-actions">
              <button type="button" onClick={() => handleEditCourse(course)} className="action-btn">
                <Edit2 size={16} />
              </button>
              <button type="button" onClick={() => handleDeleteCourse(course.id)} className="action-btn delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCardView = () => (
    <div className="courses-grid fade-in">
      {coursesInView.map((course, idx) => {
        const fileCount = getCourseFiles(course.id).length
        return (
          <div
            key={course.id}
            className="course-card"
            style={{ '--delay': `${idx * 0.05}s`, '--accent': course.color }}
          >
            <div className="card-glow-effect" style={{ background: course.color }} />
            <div className="card-top">
              <div className="card-header">
                <span className="card-code" style={{ color: course.color }}>
                  {getCourseProperty(course, 'Course Code') || '—'}
                </span>
                <div className="card-actions">
                  <button type="button" onClick={() => handleEditCourse(course)} className="card-action-btn">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" onClick={() => handleDeleteCourse(course.id)} className="card-action-btn delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="card-title">{getCourseDisplayName(course)}</h3>
              <div className="card-properties">
                {courseDefs
                  .filter((d) => d.name !== 'Course Code' && d.name !== 'Course Name')
                  .slice(0, 4)
                  .map((def) => {
                    const v = getCourseProperty(course, def.name)
                    if (!v) return null
                    return (
                      <span key={def.id} className="property-tag">
                        {def.name}: {v}
                      </span>
                    )
                  })}
              </div>
            </div>
            <div className="card-footer">
              <div className="card-progress">
                <div className="card-progress-bar">
                  <div
                    className="card-progress-fill"
                    style={{ width: `${course.progress || 0}%`, background: course.color }}
                  />
                </div>
                <span className="card-progress-text">{course.progress || 0}%</span>
              </div>
              {fileCount > 0 && (
                <span className="card-files">{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="courses-page">
      <div className="page-header">
        <div>
          <h1>Courses</h1>
          <p className="subtitle">
            {isViewingAll ? (
              <>All semesters · {courses.length} course{courses.length !== 1 ? 's' : ''}</>
            ) : (
              <>
                <span className="scope-badge">
                  <Layers size={14} />
                  {getSemesterById(selectedSemesterId)?.name ?? 'Semester'}
                </span>
                {' · '}
                {coursesInView.length} course{coursesInView.length !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              title="Card View"
            >
              <Grid size={18} />
            </button>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowPropertyManager(true)}
            title="Manage properties"
          >
            <Settings2 size={18} />
            Properties
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => openCourseModalWithSemester(selectedSemesterId)}
          >
            <Plus size={18} />
            Add Course
          </button>
        </div>
      </div>

      <div className="courses-content">
        {showGroupedBySemester ? (
          <div className="courses-grouped">
            {coursesBySemester.map(({ semester, courses: semCourses }) => (
              <div key={semester.id} className="courses-semester-block">
                <div className="courses-semester-header">
                  <h3 className="courses-semester-name">{semester.name}</h3>
                  <span className="courses-semester-count">{semCourses.length} courses</span>
                  <button
                    type="button"
                    className="btn-text-link"
                    onClick={() => setSelectedSemesterId(semester.id)}
                  >
                    View only this semester
                  </button>
                </div>
                {viewMode === 'list' ? (
                  <div className="courses-list fade-in">
                    <div className="list-header">
                      <span className="col-name">Name</span>
                      {courseDefs.slice(0, 3).map((def) => (
                        <span key={def.id} className="col-detail">{def.name}</span>
                      ))}
                      <span className="col-progress">Progress</span>
                      <span className="col-actions">Actions</span>
                    </div>
                    <div className="list-body">
                      {semCourses.map((course, idx) => (
                        <div key={course.id} className="list-row" style={{ '--delay': `${idx * 0.05}s` }}>
                          <div className="col-name">
                            <span className="course-name">{getCourseDisplayName(course)}</span>
                          </div>
                          {courseDefs.slice(0, 3).map((def) => (
                            <div key={def.id} className="col-detail">
                              <span className="detail-value">{getCourseProperty(course, def.name)}</span>
                            </div>
                          ))}
                          <div className="col-progress">
                            <div className="mini-progress">
                              <div className="mini-progress-fill" style={{ width: `${course.progress || 0}%`, background: course.color }} />
                            </div>
                            <span className="progress-text">{course.progress || 0}%</span>
                          </div>
                          <div className="col-actions">
                            <button type="button" onClick={() => handleEditCourse(course)} className="action-btn">
                              <Edit2 size={16} />
                            </button>
                            <button type="button" onClick={() => handleDeleteCourse(course.id)} className="action-btn delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="courses-grid fade-in">
                    {semCourses.map((course, idx) => {
                      const fileCount = getCourseFiles(course.id).length
                      return (
                        <div key={course.id} className="course-card" style={{ '--delay': `${idx * 0.05}s`, '--accent': course.color }}>
                          <div className="card-glow-effect" style={{ background: course.color }} />
                          <div className="card-top">
                            <div className="card-header">
                              <span className="card-code" style={{ color: course.color }}>
                                {getCourseProperty(course, 'Course Code') || '—'}
                              </span>
                              <div className="card-actions">
                                <button type="button" onClick={() => handleEditCourse(course)} className="card-action-btn">
                                  <Edit2 size={14} />
                                </button>
                                <button type="button" onClick={() => handleDeleteCourse(course.id)} className="card-action-btn delete">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <h3 className="card-title">{getCourseDisplayName(course)}</h3>
                            <div className="card-properties">
                              {courseDefs.filter((d) => d.name !== 'Course Code' && d.name !== 'Course Name').slice(0, 4).map((def) => {
                                const v = getCourseProperty(course, def.name)
                                if (!v) return null
                                return (
                                  <span key={def.id} className="property-tag">
                                    {def.name}: {v}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                          <div className="card-footer">
                            <div className="card-progress">
                              <div className="card-progress-bar">
                                <div className="card-progress-fill" style={{ width: `${course.progress || 0}%`, background: course.color }} />
                              </div>
                              <span className="card-progress-text">{course.progress || 0}%</span>
                            </div>
                            {fileCount > 0 && <span className="card-files">{fileCount} file{fileCount !== 1 ? 's' : ''}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
            {unassignedCourses.length > 0 && (
              <div className="courses-semester-block">
                <div className="courses-semester-header">
                  <h3 className="courses-semester-name">Unassigned</h3>
                  <span className="courses-semester-count">{unassignedCourses.length} courses</span>
                </div>
                {viewMode === 'list' ? (
                  <div className="courses-list fade-in">
                    <div className="list-header">
                      <span className="col-name">Name</span>
                      {courseDefs.slice(0, 3).map((def) => (
                        <span key={def.id} className="col-detail">{def.name}</span>
                      ))}
                      <span className="col-progress">Progress</span>
                      <span className="col-actions">Actions</span>
                    </div>
                    <div className="list-body">
                      {unassignedCourses.map((course, idx) => (
                        <div key={course.id} className="list-row" style={{ '--delay': `${idx * 0.05}s` }}>
                          <div className="col-name"><span className="course-name">{getCourseDisplayName(course)}</span></div>
                          {courseDefs.slice(0, 3).map((def) => (
                            <div key={def.id} className="col-detail">
                              <span className="detail-value">{getCourseProperty(course, def.name)}</span>
                            </div>
                          ))}
                          <div className="col-progress">
                            <div className="mini-progress">
                              <div className="mini-progress-fill" style={{ width: `${course.progress || 0}%`, background: course.color }} />
                            </div>
                            <span className="progress-text">{course.progress || 0}%</span>
                          </div>
                          <div className="col-actions">
                            <button type="button" onClick={() => handleEditCourse(course)} className="action-btn"><Edit2 size={16} /></button>
                            <button type="button" onClick={() => handleDeleteCourse(course.id)} className="action-btn delete"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="courses-grid fade-in">
                    {unassignedCourses.map((course, idx) => {
                      const fileCount = getCourseFiles(course.id).length
                      return (
                        <div key={course.id} className="course-card" style={{ '--delay': `${idx * 0.05}s`, '--accent': course.color }}>
                          <div className="card-glow-effect" style={{ background: course.color }} />
                          <div className="card-top">
                            <div className="card-header">
                              <span className="card-code" style={{ color: course.color }}>{getCourseProperty(course, 'Course Code') || '—'}</span>
                              <div className="card-actions">
                                <button type="button" onClick={() => handleEditCourse(course)} className="card-action-btn"><Edit2 size={14} /></button>
                                <button type="button" onClick={() => handleDeleteCourse(course.id)} className="card-action-btn delete"><Trash2 size={14} /></button>
                              </div>
                            </div>
                            <h3 className="card-title">{getCourseDisplayName(course)}</h3>
                            <div className="card-properties">
                              {courseDefs.filter((d) => d.name !== 'Course Code' && d.name !== 'Course Name').slice(0, 4).map((def) => {
                                const v = getCourseProperty(course, def.name)
                                if (!v) return null
                                return <span key={def.id} className="property-tag">{def.name}: {v}</span>
                              })}
                            </div>
                          </div>
                          <div className="card-footer">
                            <div className="card-progress">
                              <div className="card-progress-bar">
                                <div className="card-progress-fill" style={{ width: `${course.progress || 0}%`, background: course.color }} />
                              </div>
                              <span className="card-progress-text">{course.progress || 0}%</span>
                            </div>
                            {fileCount > 0 && <span className="card-files">{fileCount} file{fileCount !== 1 ? 's' : ''}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : coursesInView.length > 0 ? (
          viewMode === 'list' ? renderListView() : renderCardView()
        ) : (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>Start your academic journey</h3>
            <p>
              {semesters.length === 0
                ? 'Add a semester, then add courses with your own properties.'
                : !isViewingAll
                  ? 'No courses in this semester yet.'
                  : 'Add courses and assign custom properties (e.g. Course Code, Credits).'}
            </p>
            <button type="button" className="btn-primary" onClick={() => openCourseModalWithSemester(selectedSemesterId)}>
              <Plus size={18} /> Add First Course
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Course Modal */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCourse ? 'Edit Course' : 'Add Course'}</h2>
              <button type="button" className="icon-btn" onClick={() => setShowCourseModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCourseSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  placeholder="e.g. Data Structures"
                  required
                />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select
                  value={courseForm.semesterId}
                  onChange={(e) => setCourseForm({ ...courseForm, semesterId: e.target.value })}
                >
                  <option value="">No semester</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <PropertyFormFields
                entityType="courses"
                definitions={courseDefs}
                values={courseForm.properties}
                onChange={(properties) => setCourseForm({ ...courseForm, properties })}
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCourseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCourse ? 'Update' : 'Save'} Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Property Manager */}
      {showPropertyManager && (
        <PropertyManager
          entityType="courses"
          entityLabel="Courses"
          definitions={courseDefs}
          onAdd={addPropertyDefinition}
          onDelete={deletePropertyDefinition}
          onClose={() => setShowPropertyManager(false)}
        />
      )}
    </div>
  )
}

export default Courses
