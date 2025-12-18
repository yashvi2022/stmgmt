import { useState, useEffect } from 'react';
import './App.css';

// KEEP ENV NAME AS REQUESTED
const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    course: '',
    year: '1',
    gpa: '0.0',
    status: 'active'
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  // ========================
  // API CALLS
  // ========================

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/students`);
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchStudents();
      return;
    }
    try {
      const res = await fetch(
        `${API_URL}/api/students/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('Error searching students:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingStudent
      ? `${API_URL}/api/students/${editingStudent._id}`
      : `${API_URL}/api/students`;

    const method = editingStudent ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Save failed');

      await fetchStudents();
      closeModal();
    } catch (err) {
      console.error('Error saving student:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;

    try {
      const res = await fetch(`${API_URL}/api/students/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Delete failed');

      await fetchStudents();
    } catch (err) {
      console.error('Error deleting student:', err);
    }
  };

  // ========================
  // UI HELPERS
  // ========================

  const openModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData(student);
    } else {
      setEditingStudent(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        studentId: '',
        course: '',
        year: '1',
        gpa: '0.0',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ========================
  // UI
  // ========================

  return (
    <div className="app">
      <header className="header">
        <h1>🎓 Student Management Portal</h1>
      </header>

      <div className="container">
        <div className="toolbar">
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Search</button>
          <button onClick={() => openModal()}>+ Add Student</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Year</th>
              <th>GPA</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="8">No students found</td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s._id}>
                  <td>{s.studentId}</td>
                  <td>{s.firstName} {s.lastName}</td>
                  <td>{s.email}</td>
                  <td>{s.course}</td>
                  <td>{s.year}</td>
                  <td>{s.gpa}</td>
                  <td>{s.status}</td>
                  <td>
                    <button onClick={() => openModal(s)}>Edit</button>
                    <button onClick={() => handleDelete(s._id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingStudent ? 'Edit Student' : 'Add Student'}</h2>
            <form onSubmit={handleSubmit}>
              {Object.keys(formData).map((key) => (
                <input
                  key={key}
                  name={key}
                  placeholder={key}
                  value={formData[key]}
                  onChange={handleInputChange}
                  required
                />
              ))}
              <button type="submit">Save</button>
              <button type="button" onClick={closeModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
