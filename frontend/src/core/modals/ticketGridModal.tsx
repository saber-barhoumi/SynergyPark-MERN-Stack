import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../feature-module/router/all_routes";
import CommonSelect from "../common/commonSelect";
import CommonTagsInput from "../common/Taginput";
import axios from "axios"; // pour l'appel API

const TicketGridModal = () => {
  const routes = all_routes;

  const eventCategory = [
    { value: "Select", label: "Select" },
    { value: "Internet Issue", label: "Internet Issue" },
    { value: "Redistribute", label: "Redistribute" },
    { value: "Computer", label: "Computer" },
    { value: "Complaint", label: "Complaint" },
  ];
  const priority = [
    { value: "Select", label: "Select" },
    { value: "High", label: "High" },
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
  ];
  const status = [
    { value: "Select", label: "Select" },
    { value: "Closed", label: "Closed" },
    { value: "Reopened", label: "Reopened" },
    { value: "Inprogress", label: "Inprogress" },
  ];

  // États pour le formulaire Add Ticket
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(eventCategory[0].value);
  const [ticketPriority, setTicketPriority] = useState(priority[0].value);
  const [ticketStatus, setTicketStatus] = useState(status[0].value);
  const [tags, setTags] = useState<string[]>(["Vaughan Lewis"]);

  const handleAddTicket = async () => {
    try {
      const token = localStorage.getItem("token"); // ton JWT si nécessaire
      const res = await axios.post(
        "http://localhost:5000/api/tickets",
        {
          title,
          subject,
          description,
          category,
          priority: ticketPriority,
          status: ticketStatus,
          assignedTo: tags
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Ticket ajouté :", res.data);
      // informer la page grid et fermer le modal
      try {
        window.dispatchEvent(new CustomEvent("ticket:created", { detail: { ticket: res.data } }));
      } catch (e) {
        // nop
      }
      try {
        const modalEl = document.getElementById("add_ticket");
        // @ts-ignore - bootstrap peut être injecté globalement
        const ModalCtor = (window as any)?.bootstrap?.Modal;
        if (modalEl && ModalCtor) {
          // @ts-ignore
          const existing = ModalCtor.getInstance ? ModalCtor.getInstance(modalEl) : null;
          // @ts-ignore
          const modal = existing || new ModalCtor(modalEl);
          modal.hide();
        }
      } catch (e) {
        // fallback: fermer via attribut si nécessaire
      }
      // reset formulaire
      setTitle("");
      setSubject("");
      setDescription("");
      setCategory(eventCategory[0].value);
      setTicketPriority(priority[0].value);
      setTicketStatus(status[0].value);
      setTags([]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("Erreur ajout ticket :", err.response?.data || err.message);
      } else if (err instanceof Error) {
        console.error("Erreur ajout ticket :", err.message);
      } else {
        console.error("Erreur ajout ticket :", err);
      }
      alert("Erreur lors de l'ajout du ticket");
    }
  };

  // Etats pour Edit Ticket
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState(eventCategory[0].value);
  const [editPriority, setEditPriority] = useState(priority[0].value);
  const [editStatus, setEditStatus] = useState(status[0].value);

  useEffect(() => {
    const showEditModalFallback = () => {
      const modalEl = document.getElementById("edit_ticket");
      if (!modalEl) return;
      modalEl.classList.add("show");
      (modalEl as HTMLElement).style.display = "block";
      modalEl.removeAttribute("aria-hidden");
      document.body.classList.add("modal-open");
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop fade show";
      backdrop.setAttribute("data-fallback", "true");
      document.body.appendChild(backdrop);
    };

    const onOpenEdit = (e: any) => {
      const t = e?.detail?.ticket;
      if (!t) return;
      setEditId(t._id || null);
      setEditTitle(t.title || "");
      setEditSubject(t.subject || "");
      setEditDescription(t.description || "");
      setEditCategory(t.category || eventCategory[0].value);
      setEditPriority(t.priority || priority[0].value);
      setEditStatus(t.status || status[0].value);
      // assigned to (tags)
      setTags(Array.isArray(t.assignedTo) ? t.assignedTo : []);
      try {
        const modalEl = document.getElementById("edit_ticket");
        // @ts-ignore
        const ModalCtor = (window as any)?.bootstrap?.Modal;
        if (modalEl && ModalCtor) {
          // @ts-ignore
          const modal = ModalCtor.getOrCreateInstance(modalEl);
          modal.show();
        } else {
          showEditModalFallback();
        }
      } catch {
        showEditModalFallback();
      }
    };
    window.addEventListener("ticket:openEdit" as any, onOpenEdit as any);
    return () => window.removeEventListener("ticket:openEdit" as any, onOpenEdit as any);
  }, []);

  const handleEditTicket = async () => {
    if (!editId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:5000/api/tickets/${editId}`,
        {
          title: editTitle,
          subject: editSubject,
          description: editDescription,
          category: editCategory,
          priority: editPriority,
          status: editStatus,
          assignedTo: tags,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // dispatch update event
      try {
        window.dispatchEvent(new CustomEvent("ticket:updated", { detail: { ticket: res.data?.data } }));
      } catch {}
      // close modal
      try {
        const modalEl = document.getElementById("edit_ticket");
        // @ts-ignore
        const ModalCtor = (window as any)?.bootstrap?.Modal;
        if (modalEl && ModalCtor) {
          // @ts-ignore
          const modal = ModalCtor.getOrCreateInstance(modalEl);
          modal.hide();
        } else if (modalEl) {
          modalEl.classList.remove("show");
          (modalEl as HTMLElement).style.display = "none";
          modalEl.setAttribute("aria-hidden", "true");
          document.body.classList.remove("modal-open");
          const backdrop = document.querySelector('div.modal-backdrop[data-fallback="true"]');
          if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        }
      } catch {}
    } catch (err) {
      console.error("Erreur lors de la mise à jour du ticket", err);
      alert("Erreur lors de la mise à jour du ticket");
    }
  };

  return (
    <>
      {/* Add Ticket */}
      <div className="modal fade" id="add_ticket">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Ticket</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Event Category</label>
                      <CommonSelect
                        className="select"
                        options={eventCategory}
                        value={{ value: category, label: category }}
                        onChange={option => setCategory(option ? option.value : eventCategory[0].value)}
                        instanceId="ticket-category"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Subject</label>
                      <input
                        type="text"
                        className="form-control"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Assign To</label>
                      <CommonTagsInput
                        value={tags}
                        onChange={setTags}
                        placeholder="Add new"
                        className="custom-input-class"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Ticket Description</label>
                      <textarea
                        className="form-control"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Priority</label>
                      <CommonSelect
                        className="select"
                        options={priority}
                        value={{ value: ticketPriority, label: ticketPriority }}
                        onChange={option => setTicketPriority(option ? option.value : priority[0].value)}
                        instanceId="ticket-priority"
                      />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={status}
                        value={{ value: ticketStatus, label: ticketStatus }}
                        onChange={option => setTicketStatus(option ? option.value : status[0].value)}
                        instanceId="ticket-status"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Link
                  to="#"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddTicket}
                  data-bs-dismiss="modal"
                >
                  Add Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Edit Ticket Modal */}
      <div className="modal fade" id="edit_ticket">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Ticket</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Event Category</label>
                      <CommonSelect
                        className="select"
                        options={eventCategory}
                        value={{ value: editCategory, label: editCategory }}
                        onChange={(opt) => setEditCategory(opt ? opt.value : eventCategory[0].value)}
                        instanceId="edit-ticket-category"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Subject</label>
                      <input type="text" className="form-control" value={editSubject} onChange={(e)=>setEditSubject(e.target.value)} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Assign To</label>
                      <CommonTagsInput
                        value={tags}
                        onChange={setTags}
                        placeholder="Add new"
                        className="custom-input-class"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Ticket Description</label>
                      <textarea
                        className="form-control"
                        placeholder="Add Question"
                        value={editDescription}
                        onChange={(e)=>setEditDescription(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Priority</label>
                      <CommonSelect
                        className="select"
                        options={priority}
                        value={{ value: editPriority, label: editPriority }}
                        onChange={(opt) => setEditPriority(opt ? opt.value : priority[0].value)}
                        instanceId="edit-ticket-priority"
                      />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={status}
                        value={{ value: editStatus, label: editStatus }}
                        onChange={(opt) => setEditStatus(opt ? opt.value : status[0].value)}
                        instanceId="edit-ticket-status"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Link
                  to="#"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </Link>
                <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleEditTicket}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* ...la partie Edit Ticket reste inchangée */}
    </>
  );
};

export default TicketGridModal;
