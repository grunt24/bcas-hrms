// File: src/pages/EvaluationFormPage.tsx

import { useEffect, useState } from "react";
import axios from "../api/_axiosInstance";
import { Spin } from "antd";
import './EvaluationPage.css';
import { UNSAFE_decodeViaTurboStream } from "react-router-dom";

// Types
type ScoreChoice = {
  value: number;
  label: string;
};

type Item = {
  itemID: number;
  subGroupID: number | null;
  groupID: number | null;
  description: string;
};

type SubGroup = {
  subGroupID: number;
  groupID: number;
  name: string;
};

type Group = {
  groupID: number;
  name: string;
  description: string;
  weight: number;
  subGroups: SubGroup[];
};

type SubGroupScore = {
  subGroupID: number;
  scoreValue: number;
};

type Evaluation = {
  employeeID: number;
  evaluatorID: number;
  evaluationDate: string;
  comments: string;
  scores: SubGroupScore[];
    evaluatorName?: string;
  evaluatorEmail?: string;
  evaluatorPosition?: number;
};

// Static score choices
const scoreChoices: ScoreChoice[] = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Fair" },
  { value: 3, label: "Satisfactory" },
  { value: 4, label: "Very Satisfactory" },
  { value: 5, label: "Excellent" },
];

const EvaluationFormPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [employees, setEmployees] = useState<{ employeeID: number; firstName: string; lastName: string }[]>([]);
  const [selectedEmployeeID, setSelectedEmployeeID] = useState<number | null>(null);
  const [comments, setComments] = useState("");
  const [scores, setScores] = useState<SubGroupScore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
    const [userData, setUserData] = useState<any>(null);

  // A map from subGroupID → list of items
  const [itemsBySubGroup, setItemsBySubGroup] = useState<Record<number, Item[]>>({});

  useEffect(() => {
    const userDataStr = localStorage.getItem("userData");
    
    if (userDataStr) {
      try {
        setUserData(JSON.parse(userDataStr));
      } catch (e) {
        console.error("Invalid userData in localStorage");
      }
    }

    setLoading(true);

    const fetchGroups = axios.get("/EvaluationStructure/groups").then((res) => {
      const raw = Array.isArray(res.data) ? res.data : res.data.result || [];
      return Promise.all(raw.map(async (g: any) => {
        const resp = await axios.get(`/EvaluationStructure/subgroups/${g.groupID}`);
        return {
          ...g,
          subGroups: resp.data || [],
        };
      }));
    });

    const fetchEmployees = axios.get("/Employees").then((res) => {
      const empData = Array.isArray(res.data) ? res.data : res.data.result || [];
      setEmployees(empData);
    });

    Promise.all([fetchGroups, fetchEmployees])
      .then(([groupData]) => {
        setGroups(groupData);

        // After groups loaded, fetch items for every subgroup
        const allSubgroups = groupData.flatMap((g) => g.subGroups);
        return Promise.all(
          allSubgroups.map(async (sub) => {
            const respItems = await axios.get<Item[]>(`/EvaluationStructure/items/by-subgroup/${sub.subGroupID}`);
            return { subGroupID: sub.subGroupID, items: respItems.data || [] };
          })
        );
      })
      .then((subItemsList) => {
        const map: Record<number, Item[]> = {};
        subItemsList.forEach((entry) => {
          map[entry.subGroupID] = entry.items;
        });
        setItemsBySubGroup(map);
      })
      .catch((err) => {
        console.error("Error loading data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleScoreChange = (subGroupID: number, value: number) => {
    setScores((prev) => {
      const without = prev.filter((s) => s.subGroupID !== subGroupID);
      return [...without, { subGroupID, scoreValue: value }];
    });
  };

const handleSubmit = () => {
  if (selectedEmployeeID == null) {
    alert("Please select employee.");
    return;
  }

  if (!userData?.employeeId) {
    alert("Evaluator information missing. Please log in again.");
    return;
  }

  const evaluation: Evaluation = {
    employeeID: selectedEmployeeID,
    evaluatorID: userData.employeeId,
    evaluationDate: new Date().toISOString(),
    comments: comments,
    scores: scores,
  };

  setSubmitting(true);

  axios
    .post("/Evaluations", evaluation)
    .then(() => {
      alert("Evaluation submitted successfully.");
      window.location.reload();
    })
    .catch((err) => {
      console.error("Error submitting evaluation:", err);
      alert("Error submitting evaluation.");
    })
    .finally(() => {
      setSubmitting(false);
    });
};


  return (
    <Spin
      spinning={loading || submitting}
      tip={submitting ? "Submitting..." : "Loading..."}
    >
      <div style={{ padding: 20 }} className="evaluation-page">
        <h1>Employee Evaluation</h1>

        <header className="page-header">
          <h1>Employee Evaluation Form</h1> {/* Updated title */}
          <p>Admin Panel - Employee Performance Assessment</p>{" "}
          {/* Updated description */}
          <p className="evaluator-info">
            Evaluator: <span>{userData?.username}</span>
          </p>
        </header>

        <div style={{ marginBottom: 20 }} className="form-section">
          <h2>Employee Information</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Select Employee: </label>
              <select
                value={selectedEmployeeID ?? ""}
                onChange={(e) => setSelectedEmployeeID(Number(e.target.value))}
                className="form-control"
              >
                <option value="" disabled>
                  -- Select an employee --
                </option>
                {employees.map((emp) => (
                  <option key={emp.employeeID} value={emp.employeeID}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {groups.map((group) => (
          <div
            key={group.groupID}
            style={{ marginBottom: 30 }}
            className="form-section"
          >
            <h2>{group.description}</h2>

            {group.subGroups && group.subGroups.length > 0 ? (
              group.subGroups.map((sub) => (
                <div
                  key={sub.subGroupID}
                  style={{ marginBottom: 15, paddingLeft: 20 }}
                  className="rating-group"
                >
                  <p>
                    <strong>SubGroup:</strong> {sub.name}
                  </p>
                  {/* Render items under this subgroup */}
                  {itemsBySubGroup[sub.subGroupID] &&
                    itemsBySubGroup[sub.subGroupID].length > 0 && (
                      <ul style={{ marginLeft: 20, marginBottom: 10 }}>
                        {itemsBySubGroup[sub.subGroupID].map((item) => (
                          <li key={item.itemID}>{item.description}</li>
                        ))}
                      </ul>
                    )}
                  {/* Then rating choices */}
                  <div>
                    {scoreChoices.map((choice) => (
                      <label key={choice.value} style={{ marginRight: 10 }}>
                        <input
                          type="radio"
                          name={`subgroup-${sub.subGroupID}`}
                          value={choice.value}
                          checked={
                            scores.find((s) => s.subGroupID === sub.subGroupID)
                              ?.scoreValue === choice.value
                          }
                          onChange={() =>
                            handleScoreChange(sub.subGroupID, choice.value)
                          }
                        />
                        {choice.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div>
                <p>No subgroups under this group.</p>
              </div>
            )}
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <label>Comments:</label>
          <br />
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            cols={60}
          />
        </div>

        <button onClick={handleSubmit}>Submit</button>
      </div>
    </Spin>
  );
};

export default EvaluationFormPage;
