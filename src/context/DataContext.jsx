import { createContext, useContext, useState, useEffect } from 'react'

const DataContext = createContext()

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('courses')
    return saved ? JSON.parse(saved) : []
  })

  const [calendarEvents, setCalendarEvents] = useState(() => {
    const saved = localStorage.getItem('calendarEvents')
    return saved ? JSON.parse(saved) : []
  })

  const [mindSpaceItems, setMindSpaceItems] = useState(() => {
    const saved = localStorage.getItem('mindSpaceItems')
    return saved ? JSON.parse(saved) : []
  })

  const [timetable, setTimetable] = useState(() => {
    const saved = localStorage.getItem('timetable')
    return saved ? JSON.parse(saved) : {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: []
    }
  })

  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('files')
    return saved ? JSON.parse(saved) : []
  })

  const [grades, setGrades] = useState(() => {
    const saved = localStorage.getItem('grades')
    return saved ? JSON.parse(saved) : []
  })

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('courses', JSON.stringify(courses))
  }, [courses])

  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents))
  }, [calendarEvents])

  useEffect(() => {
    localStorage.setItem('mindSpaceItems', JSON.stringify(mindSpaceItems))
  }, [mindSpaceItems])

  useEffect(() => {
    localStorage.setItem('timetable', JSON.stringify(timetable))
  }, [timetable])

  useEffect(() => {
    localStorage.setItem('files', JSON.stringify(files))
  }, [files])

  useEffect(() => {
    localStorage.setItem('grades', JSON.stringify(grades))
  }, [grades])

  const addCourse = (course) => {
    const newCourse = {
      id: Date.now().toString(),
      ...course,
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
    // Also remove from timetable and calendar events
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
      ...event,
      createdAt: new Date().toISOString()
    }
    setCalendarEvents([...calendarEvents, newEvent])
    return newEvent
  }

  const updateCalendarEvent = (id, updates) => {
    setCalendarEvents(calendarEvents.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  const deleteCalendarEvent = (id) => {
    setCalendarEvents(calendarEvents.filter(e => e.id !== id))
  }

  const addMindSpaceItem = (item) => {
    const newItem = {
      id: Date.now().toString(),
      ...item,
      createdAt: new Date().toISOString(),
      completed: false
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
      ...file,
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
      ...grade
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

  const value = {
    courses,
    calendarEvents,
    mindSpaceItems,
    timetable,
    files,
    grades,
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
    getCourseById
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
