import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { defaultCourses, defaultCalendarEvents, defaultTimetable, defaultMindSpaceItems, defaultGrades, defaultFiles } from '../data/demoData'

const DataContext = createContext()
const getApiUrl = () => import.meta.env.VITE_API_URL || ''

/** When served from Vite dev server (port 5173), use relative /api so the proxy is used and the auth cookie is sent. */
function getEffectiveApiBase() {
  if (typeof window === 'undefined') return getApiUrl()
  if (window.location.port === '5173') return ''
  return getApiUrl()
}

function getDataApiUrl() {
  const base = getEffectiveApiBase()
  return base ? `${base}/api/data` : '/api/data'
}

const DEMO_EMAIL = 'demo@university.edu'

const emptyTimetable = {
  monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}

// Default semesters and property definitions for demo (6 semesters)
const defaultSemesters = [
  { id: 's1', name: 'Fall 2025', order: 0 },
  { id: 's2', name: 'Spring 2025', order: 1 },
  { id: 's3', name: 'Winter 2024', order: 2 },
  { id: 's4', name: 'Fall 2024', order: 3 },
  { id: 's5', name: 'Spring 2024', order: 4 },
  { id: 's6', name: 'Winter 2023', order: 5 }
]

const defaultPropertyDefinitions = {
  courses: [
    { id: 'pc1', name: 'Course Code', type: 'text', order: 0 },
    { id: 'pc2', name: 'Course Name', type: 'text', order: 1 },
    { id: 'pc3', name: 'Venue', type: 'text', order: 2 },
    { id: 'pc4', name: 'Faculty', type: 'text', order: 3 },
    { id: 'pc5', name: 'Credits', type: 'text', order: 4 },
    { id: 'pc6', name: 'Section', type: 'text', order: 5 },
    { id: 'pc7', name: 'Prerequisites', type: 'text', order: 6 },
    { id: 'pc8', name: 'Office Hours', type: 'text', order: 7 },
    { id: 'pc9', name: 'Schedule', type: 'text', order: 8 },
    { id: 'pc10', name: 'Contact Hours', type: 'text', order: 9 },
    { id: 'pc11', name: 'Department', type: 'text', order: 10 },
    { id: 'pc12', name: 'Textbook', type: 'text', order: 11 },
    { id: 'pc13', name: 'Syllabus Link', type: 'text', order: 12 },
    { id: 'pc14', name: 'LMS Link', type: 'text', order: 13 }
  ],
  calendar_events: [
    { id: 'pe1', name: 'Location', type: 'text', order: 0 },
    { id: 'pe2', name: 'Reminder', type: 'text', order: 1 },
    { id: 'pe3', name: 'Meeting Link', type: 'text', order: 2 }
  ],
  mind_space_items: [
    { id: 'pm1', name: 'Tags', type: 'text', order: 0 },
    { id: 'pm2', name: 'Due Date', type: 'text', order: 1 },
    { id: 'pm3', name: 'Related Course', type: 'text', order: 2 }
  ],
  files: [
    { id: 'pf1', name: 'Category', type: 'text', order: 0 },
    { id: 'pf2', name: 'Notes', type: 'text', order: 1 },
    { id: 'pf3', name: 'Version', type: 'text', order: 2 }
  ],
  grades: [
    { id: 'pg1', name: 'Remarks', type: 'text', order: 0 },
    { id: 'pg2', name: 'Grade Type', type: 'text', order: 1 },
    { id: 'pg3', name: 'Internal', type: 'text', order: 2 },
    { id: 'pg4', name: 'External', type: 'text', order: 3 }
  ]
}

// Demo placeholder data (courses, events, timetable, notes, grades, files) imported from ../data/demoData

function getDataKey(user) {
  if (!user) return null
  return user.email?.toLowerCase() === DEMO_EMAIL ? 'demo' : user.id
}

const SAVE_DEBOUNCE_MS = 250

export const DataProvider = ({ children }) => {
  const { user } = useAuth()
  const dataKey = getDataKey(user)
  const skipSaveRef = useRef(false)
  const saveTimeoutRef = useRef(null)
  const latestPayloadRef = useRef(null)

  const [courses, setCourses] = useState([])
  const [calendarEvents, setCalendarEvents] = useState([])
  const [mindSpaceItems, setMindSpaceItems] = useState([])
  const [timetable, setTimetable] = useState(emptyTimetable)
  const [files, setFiles] = useState([])
  const [grades, setGrades] = useState([])
  const [semesters, setSemesters] = useState([])
  const [propertyDefinitions, setPropertyDefinitions] = useState({})
  const [dataLoading, setDataLoading] = useState(false)

  const saveToBackend = (payload) => {
    const body = payload ?? latestPayloadRef.current ?? {
      courses,
      calendarEvents,
      mindSpaceItems,
      timetable,
      files,
      grades,
      semesters,
      propertyDefinitions
    }
    if (!body) return
    fetch(getDataApiUrl(), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then((res) => {
        if (!res.ok) {
          console.warn('[Data] Save failed:', res.status, '- data may not persist after reload. Ensure backend is running and you are logged in.')
        }
      })
      .catch((err) => console.error('[Data] Save error:', err))
  }

  // Load data from backend when user (dataKey) changes
  useEffect(() => {
    if (!dataKey) {
      setCourses([])
      setCalendarEvents([])
      setMindSpaceItems([])
      setTimetable(emptyTimetable)
      setFiles([])
      setGrades([])
      setSemesters([])
      setPropertyDefinitions({})
      setDataLoading(false)
      return
    }
    let cancelled = false
    setDataLoading(true)
    fetch(getDataApiUrl(), { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          console.warn('[Data] Load failed:', res.status, res.statusText, '- ensure backend is running and you are logged in (use app from same origin as dev server)')
          return Promise.reject(new Error(`Load failed: ${res.status}`))
        }
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const isDemo = dataKey === 'demo'
        const isEmpty = !data.courses?.length && !data.calendarEvents?.length && !data.mindSpaceItems?.length
        // Demo: treat as incomplete if we have old/partial data (e.g. < 48 courses, < 60 events/notes) and upgrade to full dataset
        const isDemoIncomplete = isDemo && !isEmpty && (
          (data.courses?.length ?? 0) < 48 ||
          (data.calendarEvents?.length ?? 0) < 60 ||
          (data.mindSpaceItems?.length ?? 0) < 60
        )
        if (isDemo && (isEmpty || isDemoIncomplete)) {
          setCourses(defaultCourses)
          setCalendarEvents(defaultCalendarEvents)
          setMindSpaceItems(defaultMindSpaceItems)
          setTimetable(defaultTimetable)
          setFiles(defaultFiles)
          setGrades(defaultGrades)
          setSemesters(defaultSemesters)
          setPropertyDefinitions(defaultPropertyDefinitions)
          skipSaveRef.current = true
          fetch(getDataApiUrl(), {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courses: defaultCourses,
              calendarEvents: defaultCalendarEvents,
              mindSpaceItems: defaultMindSpaceItems,
              timetable: defaultTimetable,
              files: defaultFiles,
              grades: defaultGrades,
              semesters: defaultSemesters,
              propertyDefinitions: defaultPropertyDefinitions
            })
          }).catch(() => {})
        } else {
          // Demo account: always use defaultSemesters (6) so demo never shows old/stale semester list from backend
          const semestersToUse = isDemo ? defaultSemesters : (data.semesters ?? [])
          setCourses(data.courses ?? [])
          setCalendarEvents(data.calendarEvents ?? [])
          setMindSpaceItems(data.mindSpaceItems ?? [])
          setTimetable(data.timetable && Object.keys(data.timetable).length ? data.timetable : emptyTimetable)
          setFiles(data.files ?? [])
          setGrades(data.grades ?? [])
          setSemesters(semestersToUse)
          setPropertyDefinitions(data.propertyDefinitions ?? {})
          skipSaveRef.current = true
          // Persist demo semesters to backend so stored data matches (backend expects full payload)
          if (isDemo && (data.semesters ?? []).length !== defaultSemesters.length) {
            const fullPayload = {
              courses: data.courses ?? [],
              calendarEvents: data.calendarEvents ?? [],
              mindSpaceItems: data.mindSpaceItems ?? [],
              timetable: data.timetable && Object.keys(data.timetable).length ? data.timetable : emptyTimetable,
              files: data.files ?? [],
              grades: data.grades ?? [],
              semesters: defaultSemesters,
              propertyDefinitions: data.propertyDefinitions ?? {}
            }
            fetch(getDataApiUrl(), {
              method: 'PUT',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fullPayload)
            }).catch(() => {})
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCourses([])
          setCalendarEvents([])
          setMindSpaceItems([])
          setTimetable(emptyTimetable)
          setFiles([])
          setGrades([])
          setSemesters([])
          setPropertyDefinitions({})
        }
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false)
      })
    return () => { cancelled = true }
  }, [dataKey])

  // Keep latest payload ref updated for unload save
  useEffect(() => {
    latestPayloadRef.current = {
      courses,
      calendarEvents,
      mindSpaceItems,
      timetable,
      files,
      grades,
      semesters,
      propertyDefinitions
    }
  }, [courses, calendarEvents, mindSpaceItems, timetable, files, grades, semesters, propertyDefinitions])

  // Debounced save to backend when data changes
  useEffect(() => {
    if (!dataKey) return
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null
      saveToBackend(latestPayloadRef.current)
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [dataKey, courses, calendarEvents, mindSpaceItems, timetable, files, grades, semesters, propertyDefinitions])

  // Save immediately when user leaves tab or refreshes so data isn't lost
  useEffect(() => {
    if (!dataKey) return
    const apiUrl = getDataApiUrl()
    const flushSave = () => {
      const payload = latestPayloadRef.current
      if (payload) {
        fetch(apiUrl, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {})
      }
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushSave()
    }
    window.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', flushSave)
    return () => {
      window.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', flushSave)
    }
  }, [dataKey])

  const addCourse = (course) => {
    const newCourse = {
      id: Date.now().toString(),
      name: course.name ?? '',
      semesterId: course.semesterId ?? null,
      properties: course.properties ?? {},
      progress: course.progress ?? 0,
      color: course.color ?? ['#3b82f6', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 6)],
      createdAt: new Date().toISOString()
    }
    setCourses([...courses, newCourse])
    return newCourse
  }

  const updateCourse = (id, updates) => {
    setCourses(courses.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id))
    setTimetable(prev => {
      const newTimetable = { ...prev }
      Object.keys(newTimetable).forEach(day => {
        newTimetable[day] = newTimetable[day].filter(period => period.courseId !== id)
      })
      return newTimetable
    })
    setCalendarEvents(prev => prev.filter(e => e.courseId !== id))
  }

  const addCalendarEvent = (event) => {
    const newEvent = {
      id: Date.now().toString(),
      title: event.title ?? '',
      date: event.date ?? '',
      time: event.time ?? '',
      type: event.type ?? 'other',
      courseId: event.courseId ?? '',
      semesterId: event.semesterId ?? null,
      description: event.description ?? '',
      properties: event.properties ?? {},
      createdAt: new Date().toISOString()
    }
    setCalendarEvents([...calendarEvents, newEvent])
    return newEvent
  }

  const updateCalendarEvent = (id, updates) => {
    setCalendarEvents(calendarEvents.map(e =>
      e.id === id ? { ...e, ...updates, semesterId: updates.semesterId ?? e.semesterId } : e
    ))
  }

  const deleteCalendarEvent = (id) => {
    setCalendarEvents(calendarEvents.filter(e => e.id !== id))
  }

  const addMindSpaceItem = (item) => {
    const newItem = {
      id: Date.now().toString(),
      title: item.title ?? '',
      content: item.content ?? '',
      type: item.type ?? 'text',
      priority: item.priority ?? 'medium',
      file: item.file ?? null,
      properties: item.properties ?? {},
      semesterId: item.semesterId ?? null,
      createdAt: new Date().toISOString(),
      completed: item.completed ?? false
    }
    setMindSpaceItems([...mindSpaceItems, newItem])
    return newItem
  }

  const updateMindSpaceItem = (id, updates) => {
    setMindSpaceItems(mindSpaceItems.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  const deleteMindSpaceItem = (id) => {
    setMindSpaceItems(mindSpaceItems.filter(i => i.id !== id))
  }

  const updateTimetable = (day, periods) => {
    setTimetable({ ...timetable, [day]: periods })
  }

  const addFile = (file) => {
    const newFile = {
      id: Date.now().toString(),
      name: file.name ?? '',
      courseId: file.courseId ?? null,
      fileName: file.fileName ?? file.name,
      fileSize: file.fileSize ?? 0,
      fileType: file.fileType ?? '',
      fileData: file.fileData ?? null,
      properties: file.properties ?? {},
      uploadedAt: new Date().toISOString()
    }
    setFiles([...files, newFile])
    return newFile
  }

  const deleteFile = (id) => {
    setFiles(files.filter(f => f.id !== id))
  }

  const addGrade = (grade) => {
    const newGrade = {
      id: Date.now().toString(),
      courseId: grade.courseId ?? '',
      grade: grade.grade ?? '',
      credits: grade.credits ?? '',
      semester: grade.semester ?? '',
      properties: grade.properties ?? {}
    }
    setGrades([...grades, newGrade])
    return newGrade
  }

  const updateGrade = (id, updates) => {
    setGrades(grades.map(g => g.id === id ? { ...g, ...updates } : g))
  }

  const deleteGrade = (id) => {
    setGrades(grades.filter(g => g.id !== id))
  }

  const getCourseById = (id) => {
    return courses.find(c => c.id === id)
  }

  const getCourseDisplayName = (course) => {
    if (!course) return ''
    return course.name ?? course.courseName ?? 'Untitled'
  }

  const getCourseProperty = (course, key) => {
    if (!course) return ''
    if (course.properties && typeof course.properties[key] !== 'undefined' && course.properties[key] !== '') return course.properties[key]
    const lower = key.toLowerCase()
    if (lower === 'course code') return course.courseCode ?? ''
    if (lower === 'course name') return course.courseName ?? course.name ?? ''
    if (lower === 'venue') return course.venue ?? ''
    if (lower === 'faculty') return course.faculty ?? ''
    if (lower === 'credits') return course.credits ?? ''
    return ''
  }

  // Semesters CRUD
  const addSemester = (semester) => {
    const newSemester = {
      id: Date.now().toString(),
      name: semester.name ?? 'New Semester',
      order: typeof semester.order === 'number' ? semester.order : semesters.length
    }
    setSemesters([...semesters, newSemester].sort((a, b) => a.order - b.order))
    return newSemester
  }

  const updateSemester = (id, updates) => {
    setSemesters(semesters.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const deleteSemester = (id) => {
    setSemesters(semesters.filter(s => s.id !== id))
    setCourses(courses.map(c => c.semesterId === id ? { ...c, semesterId: null } : c))
  }

  const getSemesterById = (id) => {
    return semesters.find(s => s.id === id) ?? null
  }

  // Property definitions CRUD (per entity type: courses, calendar_events, mind_space_items, files, grades)
  const ENTITY_TYPES = ['courses', 'calendar_events', 'mind_space_items', 'files', 'grades']

  const getPropertyDefinitions = (entityType) => {
    const list = propertyDefinitions[entityType]
    return Array.isArray(list) ? [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : []
  }

  const addPropertyDefinition = (entityType, def) => {
    const list = getPropertyDefinitions(entityType)
    const newDef = {
      id: Date.now().toString(),
      name: def.name ?? 'New Property',
      type: def.type ?? 'text',
      order: typeof def.order === 'number' ? def.order : list.length
    }
    const next = { ...propertyDefinitions, [entityType]: [...list, newDef] }
    setPropertyDefinitions(next)
    return newDef
  }

  const updatePropertyDefinition = (entityType, id, updates) => {
    const list = propertyDefinitions[entityType] ?? []
    const updated = list.map(d => d.id === id ? { ...d, ...updates } : d)
    setPropertyDefinitions({ ...propertyDefinitions, [entityType]: updated })
  }

  const deletePropertyDefinition = (entityType, id) => {
    const list = (propertyDefinitions[entityType] ?? []).filter(d => d.id !== id)
    setPropertyDefinitions({ ...propertyDefinitions, [entityType]: list })
  }

  // Reset current user's data to defaults (demo = placeholder, others = empty) and save to backend
  const resetToDefaults = () => {
    if (!dataKey) return
    const isDemo = dataKey === 'demo'
    const newCourses = isDemo ? defaultCourses : []
    const newEvents = isDemo ? defaultCalendarEvents : []
    const newMind = isDemo ? defaultMindSpaceItems : []
    const newTimetable = isDemo ? defaultTimetable : emptyTimetable
    const newFiles = isDemo ? defaultFiles : []
    const newGrades = isDemo ? defaultGrades : []
    const newSemesters = isDemo ? defaultSemesters : []
    const newPropDefs = isDemo ? defaultPropertyDefinitions : {}
    setCourses(newCourses)
    setCalendarEvents(newEvents)
    setMindSpaceItems(newMind)
    setTimetable(newTimetable)
    setFiles(newFiles)
    setGrades(newGrades)
    setSemesters(newSemesters)
    setPropertyDefinitions(newPropDefs)
    skipSaveRef.current = true
    fetch(getDataApiUrl(), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courses: newCourses,
        calendarEvents: newEvents,
        mindSpaceItems: newMind,
        timetable: newTimetable,
        files: newFiles,
        grades: newGrades,
        semesters: newSemesters,
        propertyDefinitions: newPropDefs
      })
    }).catch(() => {})
  }

  const value = {
    courses,
    calendarEvents,
    mindSpaceItems,
    timetable,
    files,
    grades,
    semesters,
    propertyDefinitions,
    dataLoading,
    addCourse,
    updateCourse,
    deleteCourse,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    addMindSpaceItem,
    updateMindSpaceItem,
    deleteMindSpaceItem,
    updateTimetable,
    addFile,
    deleteFile,
    addGrade,
    updateGrade,
    deleteGrade,
    getCourseById,
    getCourseDisplayName,
    getCourseProperty,
    addSemester,
    updateSemester,
    deleteSemester,
    getSemesterById,
    getPropertyDefinitions,
    addPropertyDefinition,
    updatePropertyDefinition,
    deletePropertyDefinition,
    ENTITY_TYPES,
    resetToDefaults
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
