// File: src/pages/EvaluationPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../types/useAuth';
import { EmployeeService } from '../api/EmployeeService';
import GenericService from '../api/GenericService';
import { Employee } from '../types/tblEmployees';
import './EvaluationPage.css';

interface EvaluationData {
  employeeId: number; 
  evaluatorId: number;
  evaluationDate: string;
  teachingQualifications: {
    mastery: number;
    strategies: number;
    communication: number;
    evaluation: number;
    personal: number;
    professional: number;
    reports: number;
  };
  classAuthority: {
    management: number;
    discipline: number;
  };
  punctuality: {
    tardiness: number;
    absences: number;
    daysAbsent: number;
  };
  otherQualifications: {
    achievements: number;
    rules: number;
    community: number;
    initiatives: number;
    extraTasks: number;
  };
  sep: number;
  comments: string;
}

const EvaluationPage: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [generalAverage, setGeneralAverage] = useState<number>(0);

  const [evaluationData, setEvaluationData] = useState<EvaluationData>({
    employeeId: 0,
    evaluatorId: user?.userId || 0,
    evaluationDate: new Date().toISOString().split('T')[0],
    teachingQualifications: {
      mastery: 0,
      strategies: 0,
      communication: 0,
      evaluation: 0,
      personal: 0,
      professional: 0,
      reports: 0
    },
    classAuthority: {
      management: 0,
      discipline: 0
    },
    punctuality: {
      tardiness: 0,
      absences: 0,
      daysAbsent: 0
    },
    otherQualifications: {
      achievements: 0,
      rules: 0,
      community: 0,
      initiatives: 0,
      extraTasks: 0
    },
    sep: 0,
    comments: ''
  });

  useEffect(() => {
    fetchEmployees(); 
  }, []);

  useEffect(() => {
    calculateGeneralAverage();
  }, [evaluationData]);

  const fetchEmployees = async () => { 
    try {
      const response = await EmployeeService.getAll();
      setEmployees(response); 
    } catch (error) {
      console.error('Error fetching employees:', error); // Updated error message
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    if (!section) {
      setEvaluationData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setEvaluationData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof EvaluationData] as object),
          [field]: value
        }
      }));
    }
  };

  const calculateAverage = (section: keyof Omit<EvaluationData, 'employeeId' | 'evaluatorId' | 'evaluationDate' | 'comments'>) => { // Updated key
    const values = Object.values(evaluationData[section]);
    const numericValues = values.filter(val => typeof val === 'number') as number[];
    if (numericValues.length === 0) return 0;
    return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
  };

  const calculateGeneralAverage = () => {
    const teachingScore = calculateAverage('teachingQualifications') * 0.25;
    const authorityScore = calculateAverage('classAuthority') * 0.25;
    const punctualityScore = calculateAverage('punctuality') * 0.25;
    const otherScore = calculateAverage('otherQualifications') * 0.15;
    const sepScore = evaluationData.sep * 0.10;
    
    const totalScore = teachingScore + authorityScore + punctualityScore + otherScore + sepScore;
    setGeneralAverage(parseFloat(totalScore.toFixed(2)));
  };

  const getAttendanceRating = (daysAbsent: number) => {
    if (daysAbsent === 0) return 5.0;
    if (daysAbsent === 1) return 4.5;
    if (daysAbsent === 2) return 4.0;
    if (daysAbsent === 3) return 3.5;
    if (daysAbsent === 4) return 3.0;
    if (daysAbsent === 5) return 2.5;
    if (daysAbsent === 6) return 2.4;
    if (daysAbsent === 7) return 2.3;
    if (daysAbsent === 8) return 2.2;
    if (daysAbsent === 9) return 2.1;
    if (daysAbsent === 10) return 2.0;
    return 1.0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const evaluationPayload = {
        ...evaluationData,
        finalScore: generalAverage,
        status: 'completed',
        createdAt: new Date().toISOString(),
        evaluatorName: `${user?.username}`
      };
      
      // Save evaluation to database
      await GenericService('evaluations').add(evaluationPayload);
      
      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus('idle'), 3000);
      
      // Reset form
      setEvaluationData({
        employeeId: 0, 
        evaluatorId: user?.userId || 0,
        evaluationDate: new Date().toISOString().split('T')[0],
        teachingQualifications: {
          mastery: 0,
          strategies: 0,
          communication: 0,
          evaluation: 0,
          personal: 0,
          professional: 0,
          reports: 0
        },
        classAuthority: {
          management: 0,
          discipline: 0
        },
        punctuality: {
          tardiness: 0,
          absences: 0,
          daysAbsent: 0
        },
        otherQualifications: {
          achievements: 0,
          rules: 0,
          community: 0,
          initiatives: 0,
          extraTasks: 0
        },
        sep: 0,
        comments: ''
      });
      
      setGeneralAverage(0);
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const RatingOptions: React.FC<{ 
    name: string; 
    value: number; 
    onChange: (value: number) => void;
    indicators?: string[];
  }> = ({ name, value, onChange, indicators }) => (
    <div className="rating-item">
      {indicators && indicators.length > 0 && (
        <ul className="behavioral-indicators">
          {indicators.map((indicator, index) => (
            <li key={index}>{indicator}</li>
          ))}
        </ul>
      )}
      <div className="rating-options">
        {[1, 2, 3, 4, 5].map(option => (
          <label key={option} className="rating-label">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="rating-input"
            />
            <span className="rating-circle"></span>
            <span className="rating-text">{option} - {option === 5 ? 'Excellent' : option === 4 ? 'Very Satisfactory' : option === 3 ? 'Satisfactory' : option === 2 ? 'Fair' : 'Poor'}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="evaluation-page">
      <header className="page-header">
        <h1>Employee Evaluation Form</h1> {/* Updated title */}
        <p>Admin Panel - Employee Performance Assessment</p> {/* Updated description */}
        <p className="evaluator-info">Evaluator: <span>{user?.firstName} {user?.lastName}</span></p>
      </header>

      {submitStatus === 'success' && (
        <div className="alert alert-success">
          Evaluation submitted successfully!
        </div>
      )}
      
      {submitStatus === 'error' && (
        <div className="alert alert-error">
          Error submitting evaluation. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="evaluation-form">
        {/* Employee Selection */}
        <div className="form-section">
          <h2>Employee Information</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Select Employee:</label>
              <select 
                value={evaluationData.employeeId}
                onChange={(e) => handleInputChange('', 'employeeId', parseInt(e.target.value))}
                required
                className="form-control"
              >
                <option value={0}>Select an employee</option>
                {employees.map(employee => ( 
                  <option key={employee.employeeID} value={employee.employeeID}>
                    {employee.firstName} {employee.lastName} 
                    {employee.positionID && ` - Position: ${employee.positionID}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Evaluation Date:</label>
              <input 
                type="date" 
                value={evaluationData.evaluationDate}
                onChange={(e) => handleInputChange('', 'evaluationDate', e.target.value)}
                required
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* A. TEACHING PROFESSION QUALIFICATIONS (25%) */}
        <div className="form-section">
          <h2>A. Teaching Profession Qualifications (25%)</h2>
          
          <div className="rating-group">
            <h3>1. Mastery of the Subject Matter</h3>
            <RatingOptions 
              name="mastery" 
              value={evaluationData.teachingQualifications.mastery} 
              onChange={(value) => handleInputChange('teachingQualifications', 'mastery', value)}
              indicators={[
                "Gives knowledgeable answers to students' questions",
                "Can simplify complex concepts/principles/theories to facilitate learning",
                "Shows expertise in the subject being taught",
                "Relates the subject matter to practical life situations/problems"
              ]}
            />
          </div>
          
          <div className="rating-group">
            <h3>2. Teaching Strategies</h3>
            <RatingOptions 
              name="strategies" 
              value={evaluationData.teachingQualifications.strategies} 
              onChange={(value) => handleInputChange('teachingQualifications', 'strategies', value)}
              indicators={[
                "Uses varied appropriate instructional aids skillfully and efficiently",
                "Employs teaching strategies that take into account students' varied learning styles, interests and experiences",
                "Presents the lesson in an interesting way to stimulate students' interest",
                "Shows sensitivity to students' learning difficulties, concerns and expectations"
              ]}
            />
          </div>
          
          <div className="rating-group">
            <h3>3. Communication Skills</h3>
            <RatingOptions 
              name="communication" 
              value={evaluationData.teachingQualifications.communication} 
              onChange={(value) => handleInputChange('teachingQualifications', 'communication', value)}
              indicators={[
                "Communicates fluently either in English or in Filipino and refrains from using Taglish",
                "Speaks clearly and audibly",
                "Does not lecture to the board",
                "Does not have distracting speech mannerisms",
                "Makes appropriate use of verbal and nonverbal language",
                "Gives clear verbal or written instructions/directions"
              ]}
            />
          </div>
          
          <div className="rating-group">
            <h3>4. Evaluation Skills</h3>
            <RatingOptions 
              name="evaluation" 
              value={evaluationData.teachingQualifications.evaluation} 
              onChange={(value) => handleInputChange('teachingQualifications', 'evaluation', value)}
              indicators={[
                "Returns checked test papers, projects and other students' performance outputs",
                "Clarifies criteria in grading learning outputs",
                "Practices fairness in grading students' learning outputs",
                "Involves the students in setting the criteria for performance-based outputs"
              ]}
            />
          </div>
          
          <div className="rating-group">
            <h3>5. Personal Qualities</h3>
            <RatingOptions 
              name="personal" 
              value={evaluationData.teachingQualifications.personal} 
              onChange={(value) => handleInputChange('teachingQualifications', 'personal', value)}
              indicators={[
                "Observes problems in the use of language",
                "Manifests good relationship with students, peers and administrators",
                "Accepts comments, suggestions and criticisms positively"
              ]}
            />
          </div>
          
          <div className="rating-group">
            <h3>6. Professional Qualities</h3>
            <RatingOptions 
              name="professional" 
              value={evaluationData.teachingQualifications.professional} 
              onChange={(value) => handleInputChange('teachingQualifications', 'professional', value)}
              indicators={[
                "Practices fairness in setting disputes/disagreements/misunderstandings",
                "Upgrades oneself professionally by pursuing graduate studies",
                "Attends seminars/workshops relevant for professional growth"
              ]}
            />
          </div>
          
          <div className="rating-group">
            <h3>7. Submission of Reports</h3>
            <RatingOptions 
              name="reports" 
              value={evaluationData.teachingQualifications.reports} 
              onChange={(value) => handleInputChange('teachingQualifications', 'reports', value)}
              indicators={[
                "Submits needed reports (tests, grades, syllabus/course outline, etc.) on time",
                "Follows required format of reports",
                "Exhibits accuracy and quality in the submitted reports"
              ]}
            />
          </div>
        </div>

        {/* B. CLASS AUTHORITY AND CONTROL QUALIFICATIONS (25%) */}
        <div className="form-section">
          <h2>B. Class Authority and Control Qualifications (25%)</h2>
          
          <div className="rating-group">
            <h3>1. Classroom Management</h3>
            <RatingOptions 
              name="management" 
              value={evaluationData.classAuthority.management} 
              onChange={(value) => handleInputChange('classAuthority', 'management', value)}
              indicators={[
                "Observes official time in coming to and leaving the class",
                "Employs efficient management of routine activities",
                "Discourages answers in chorus, unless the subject matter requires so",
                "Checks orderliness and cleanliness",
                "Provides conducive and stimulating environment to the students"
              ]}
            />
          </div>
          
          <div className="rating-group">
            <h3>2. Class Discipline</h3>
            <RatingOptions 
              name="discipline" 
              value={evaluationData.classAuthority.discipline} 
              onChange={(value) => handleInputChange('classAuthority', 'discipline', value)}
              indicators={[
                "Implements positive reinforcement for negative behavior of students",
                "Does not impose corporal punishment",
                "Monitors students' behavior during breaks and official school activities",
                "Maintains order and discipline of the assigned class in and out of the classroom",
                "Serves as a good example to his/her students"
              ]}
            />
          </div>
        </div>

        {/* C. PUNCTUALITY AND ATTENDANCE (25%) */}
        <div className="form-section">
          <h2>C. Punctuality and Attendance (25%)</h2>
          
          <div className="rating-group">
            <h3>1. Tardiness</h3>
            <RatingOptions 
              name="tardiness" 
              value={evaluationData.punctuality.tardiness} 
              onChange={(value) => handleInputChange('punctuality', 'tardiness', value)}
              indicators={[
                "Observes official time in reporting to work",
                "Demonstrates conscientiousness in following school policy on filing for leave"
              ]}
            />
          </div>
          
          <div className="rating-group">
            <h3>2. Absences</h3>
            <RatingOptions 
              name="absences" 
              value={evaluationData.punctuality.absences} 
              onChange={(value) => handleInputChange('punctuality', 'absences', value)}
              indicators={[
                "Ensures compliance to teaching obligations during absence"
              ]}
            />
          </div>
          
          <div className="form-group">
            <label>Number of Days Absent (for the whole school year):</label>
            <input 
              type="number" 
              min="0"
              value={evaluationData.punctuality.daysAbsent} 
              onChange={(e) => handleInputChange('punctuality', 'daysAbsent', parseInt(e.target.value) || 0)}
              className="form-control"
            />
            <div className="rating-info">Calculated Rating: {getAttendanceRating(evaluationData.punctuality.daysAbsent)}</div>
          </div>
        </div>

        {/* D. OTHER QUALIFICATIONS (15%) */}
        <div className="form-section">
          <h2>D. Other Qualifications (15%)</h2>
          
          <div className="rating-group">
            <RatingOptions 
              name="achievements" 
              value={evaluationData.otherQualifications.achievements} 
              onChange={(value) => handleInputChange('otherQualifications', 'achievements', value)}
              indicators={[
                "Has earned significant achievements for the school/students for the year/period"
              ]}
            />
          </div>
          
          <div className="rating-group">
            <RatingOptions 
              name="rules" 
              value={evaluationData.otherQualifications.rules} 
              onChange={(value) => handleInputChange('otherQualifications', 'rules', value)}
              indicators={[
                "Conforms with the school rules and regulations"
              ]}
            />
          </div>
          
          <div className="rating-group">
            <RatingOptions 
              name="community" 
              value={evaluationData.otherQualifications.community} 
              onChange={(value) => handleInputChange('otherQualifications', 'community', value)}
              indicators={[
                "Participates to / renders services for community activities"
              ]}
            />
          </div>
          
          <div className="rating-group">
            <RatingOptions 
              name="initiatives" 
              value={evaluationData.otherQualifications.initiatives} 
              onChange={(value) => handleInputChange('otherQualifications', 'initiatives', value)}
              indicators={[
                "Initiates useful activities for the school/students"
              ]}
            />
          </div>
          
          <div className="rating-group">
            <RatingOptions 
              name="extraTasks" 
              value={evaluationData.otherQualifications.extraTasks} 
              onChange={(value) => handleInputChange('otherQualifications', 'extraTasks', value)}
              indicators={[
                "Is willing to do extra tasks"
              ]}
            />
          </div>
        </div>

        {/* E. SPEAK ENGLISH POLICY (SEP) (10%) */}
        <div className="form-section">
          <h2>E. Speak English Policy (SEP) (10%)</h2>
          
          <div className="rating-group">
            <RatingOptions 
              name="sep" 
              value={evaluationData.sep} 
              onChange={(value) => handleInputChange('', 'sep', value)}
              indicators={[
                "Consistently follows SEP"
              ]}
            />
          </div>
        </div>

        {/* Comments Section */}
        <div className="form-section">
          <h2>Additional Comments</h2>
          
          <div className="form-group">
            <label>Comments:</label>
            <textarea 
              value={evaluationData.comments} 
              onChange={(e) => handleInputChange('', 'comments', e.target.value)}
              rows={4}
              className="form-control"
              placeholder="Enter any additional comments about the employee's performance..."
            />
          </div>
        </div>

        {/* General Average Display */}
        <div className="general-average-section">
          <h2>General Average</h2>
          <div className="average-display">
            <span className="average-label">Total Score:</span>
            <span className="average-value">{generalAverage.toFixed(2)}</span>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || evaluationData.employeeId === 0}
          >
            {loading ? 'Submitting...' : 'Submit Evaluation'}
          </button>
          <button type="button" className="btn btn-secondary">Save Draft</button>
          <button type="button" className="btn btn-danger">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EvaluationPage;