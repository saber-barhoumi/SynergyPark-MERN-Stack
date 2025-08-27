import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { all_routes } from "../router/all_routes";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import CommonSelect from "../../core/common/commonSelect";
import TicketListModal from "../../core/modals/ticketListModal";

type Ticket = {
  _id?: string;
  title: string;
  subject: string;
  description?: string;
  priority: "High" | "Low" | "Medium" | string;
  status: "Closed" | "Reopened" | "Inprogress" | "Open" | string;
  assignedTo: string[];
  category?: string;
  createdBy?: any;
  createdByUsername?: string;
  createdByEmail?: string;
  createdAt?: string;
  updatedAt?: string;
};

const TicketDetails = () => {
    const routes = all_routes;
    const { id } = useParams();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [comments, setComments] = useState<{ username?: string; text: string; createdAt?: string }[]>([]);
    const [newComment, setNewComment] = useState("");
    const [addingComment, setAddingComment] = useState(false);

    useEffect(() => {
      const fetchTicket = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("token");
          const res = await axios.get(`http://localhost:5000/api/tickets/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = res.data?.data;
          setTicket(data || null);
          setError(null);
        } catch (e) {
          setError("Erreur lors du chargement du ticket.");
        } finally {
          setLoading(false);
        }
      };
      if (id) fetchTicket();
    }, [id]);

    useEffect(() => {
      const fetchComments = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`http://localhost:5000/api/tickets/${id}/comments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setComments(res.data?.data || []);
        } catch {}
      };
      if (id) fetchComments();
    }, [id]);

    const handleAddComment = async () => {
      if (!newComment.trim()) return;
      try {
        setAddingComment(true);
        const token = localStorage.getItem("token");
        const res = await axios.post(
          `http://localhost:5000/api/tickets/${id}/comments`,
          { text: newComment.trim() },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
        const added = res.data?.data;
        if (added) setComments(prev => [added, ...prev]);
        setNewComment("");
      } catch {}
      finally {
        setAddingComment(false);
      }
    };

    const changePriority = [
        { value: "High", label: "High" },
        { value: "Medium", label: "Medium" },
        { value: "Low", label: "Low" },
    ];
    const assignTo = (ticket?.assignedTo || []).map(u => ({ value: u, label: u })) as {value:string,label:string}[];
    const ticketStatus = [
        { value: "Open", label: "Open" },
        { value: "On Hold", label: "On Hold" },
        { value: "Reopened", label: "Reopened" },
        { value: "Closed", label: "Closed" },
        { value: "Inprogress", label: "Inprogress" },
    ];

    const prBadgeClass = ticket?.priority === "High" ? "bg-danger" : ticket?.priority === "Low" ? "bg-secondary" : "bg-warning";
    const statusBadgeClass = "bg-outline-pink";
    const friendlyId = ticket?._id ? ticket._id.slice(-6).toUpperCase() : "---";
    const updatedAgo = ticket?.updatedAt || ticket?.createdAt ? new Date(ticket?.updatedAt || ticket?.createdAt as string).toLocaleString() : "-";
    const createdByName = ticket?.createdByUsername || "-";
    const createdByEmail = ticket?.createdByEmail || "-";

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Breadcrumb */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="mb-2">
            <h6 className="fw-medium d-flex align-items-center">
              <Link to={routes.adminDashboard}>
                <i className="ti ti-arrow-left me-2" />
                Ticket Details {id ? `#${id}` : ""}
              </Link>
            </h6>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="me-2 mb-2">
              <div className="dropdown">
                <Link
                  to="#"
                  className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  <i className="ti ti-file-export me-1" />
                  Export
                </Link>
                <ul className="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      <i className="ti ti-file-type-pdf me-1" />
                      Export as PDF
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      <i className="ti ti-file-type-xls me-1" />
                      Export as Excel
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mb-2">
              <Link
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#add_ticket"
                className="btn btn-primary d-flex align-items-center"
              >
                <i className="ti ti-circle-plus me-2" />
                Add Ticket
              </Link>
            </div>
            <div className="head-icons ms-2">
              <CollapseHeader />
            </div>
          </div>
        </div>
        {/* /Breadcrumb */}

        {loading && (
          <div className="alert alert-info">Chargement du ticket...</div>
        )}
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="ti ti-alert-triangle me-2" />
            <div>{error}</div>
          </div>
        )}

        {!loading && !error && ticket && (
          <div className="row">
            <div className="col-xl-9 col-md-8">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                  <h5 className="text-info fw-medium">{ticket.subject || ticket.title || "Ticket"}</h5>
                  <div className="d-flex align-items-center">
                    <span className={`badge ${prBadgeClass} me-3`}>
                      <i className="ti ti-circle-filled fs-5 me-1" />
                      {ticket.priority}
                    </span>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="dropdown-toggle px-2 py-1 btn btn-white d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        Mark as Private
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-2">
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            Mark as Private
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            Mark as Public
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  
                  <div>
                    <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom mb-3">
                      <div className="d-flex align-items-center flex-wrap">
                        <div className="mb-3">
                          <span className="badge badge-info rounded-pill mb-2">
                            Tic - {friendlyId}
                          </span>
                          <div className="d-flex align-items-center mb-2">
                            <h5 className="fw-semibold me-2">{ticket.title || "Ticket"}</h5>
                            <span className={`badge ${statusBadgeClass} d-flex align-items-center ms-1`}>
                              <i className="ti ti-circle-filled fs-5 me-1" />
                              {ticket.status || "Open"}
                            </span>
                          </div>
                          <div className="d-flex align-items-center flex-wrap row-gap-2">
                            <p className="d-flex align-items-center mb-0 me-2">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-06.jpg"
                                className="avatar avatar-xs rounded-circle me-2"
                                alt="img"
                              />
                              Assigned to
                              <span className="text-dark ms-1">
                                {ticket.assignedTo && ticket.assignedTo.length ? ticket.assignedTo.join(", ") : createdByName}
                              </span>
                            </p>
                            <p className="d-flex align-items-center mb-0 me-2">
                              <i className="ti ti-calendar-bolt me-1" />
                              Updated {updatedAgo}
                            </p>
                          </div>
                        </div>
                      </div>
                      {ticket.description && (
                        <div className="mb-3">
                          <p>{ticket.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-4">
              <div className="card">
                <div className="card-header p-3">
                  <h4>Ticket Details</h4>
                </div>
                <div className="card-body p-0">
                  <div className="border-bottom p-3">
                    <div className="mb-3">
                      <label className="form-label">Change Priority</label>
                      <CommonSelect
                        className="select"
                        options={changePriority}
                        defaultValue={{ value: ticket.priority, label: ticket.priority }}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Assign To</label>
                      <CommonSelect
                        className="select"
                        options={assignTo.length ? assignTo : [{ value: createdByName, label: createdByName }]}
                        defaultValue={assignTo.length ? assignTo[0] : { value: createdByName, label: createdByName }}
                      />
                    </div>
                    <div>
                      <label className="form-label">Ticket Status</label>
                      <CommonSelect
                        className="select"
                        options={ticketStatus}
                        defaultValue={{ value: ticket.status, label: ticket.status }}
                      />
                    </div>
                  </div>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <span className="avatar avatar-md me-2 flex-shrink-0">
                      <ImageWithBasePath
                        src="assets/img/users/user-01.jpg"
                        className="rounded-circle"
                        alt="Img"
                      />
                    </span>
                    <div>
                      <span className="fs-12">User</span>
                      <p className="text-dark">{createdByName}</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center border-bottom p-3">
                    <span className="avatar avatar-md me-2 flex-shrink-0">
                      <ImageWithBasePath
                        src="assets/img/users/user-05.jpg"
                        className="rounded-circle"
                        alt="Img"
                      />
                    </span>
                    <div>
                      <span className="fs-12">Email</span>
                      <p className="text-dark">{createdByEmail}</p>
                    </div>
                  </div>
                  <div className="border-bottom p-3">
                    <span className="fs-12">Category</span>
                    <p className="text-dark">{ticket.category || "General"}</p>
                  </div>
                  <div className="p-3">
                    <span className="fs-12">Last Updated</span>
                    <p className="text-dark">{updatedAgo}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Bottom comments section */}
        {!loading && !error && ticket && (
          <div className="row mt-3">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">Comments</h6>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-start mb-3">
                    <textarea
                      className="form-control me-2"
                      placeholder="Write a comment..."
                      rows={2}
                      value={newComment}
                      onChange={(e)=>setNewComment(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleAddComment} disabled={addingComment}>
                      {addingComment ? "Posting..." : "Post"}
                    </button>
                  </div>
                  <div>
                    {comments.length === 0 && <p className="text-muted mb-0">No comments yet.</p>}
                    {comments.map((c, idx) => (
                      <div key={idx} className="border-bottom pb-2 mb-2">
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-sm me-2"><ImageWithBasePath src="assets/img/profiles/avatar-06.jpg" alt="avatar" /></span>
                          <div>
                            <strong>{c.username || "User"}</strong>
                            <div className="fs-12 text-muted">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</div>
                          </div>
                        </div>
                        <p className="mt-2 mb-0">{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
        <p className="mb-0">2014 - 2025 © SmartHR.</p>
        <p>
          Designed &amp; Developed By {""}
          <Link to="#" className="text-primary">
            Dreams
          </Link>
        </p>
      </div>
      <TicketListModal />
    </div>
  );
};

export default TicketDetails;
