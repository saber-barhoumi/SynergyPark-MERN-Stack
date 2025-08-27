import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { all_routes } from "../router/all_routes";
import ReactApexChart from "react-apexcharts";
import TicketGridModal from "../../core/modals/ticketGridModal";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import { useAuth } from "../../contexts/AuthContext";

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
};

const TicketGrid = () => {
    const routes = all_routes
    const { user } = useAuth?.() || { user: null };

    const [recentAddSuccess, setRecentAddSuccess] = useState<string | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteFeedback, setDeleteFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

    const newTicketsCount = React.useMemo(() => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return tickets.filter(t => (t.createdAt ? new Date(t.createdAt) >= sevenDaysAgo : false)).length;
    }, [tickets]);

    const openTicketsCount = React.useMemo(() => {
        return tickets.filter(t => {
            const s = (t.status || '').toLowerCase();
            return s === 'open' || s === 'reopened';
        }).length;
    }, [tickets]);

    const solvedTicketsCount = React.useMemo(() => {
        return tickets.filter(t => (t.status || '').toLowerCase() === 'closed').length;
    }, [tickets]);

    const pendingTicketsCount = React.useMemo(() => {
        return tickets.filter(t => {
            const s = (t.status || '').toLowerCase();
            return s === 'inprogress' || s === 'pending' || s === 'on hold';
        }).length;
    }, [tickets]);

    const fetchTickets = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/tickets", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data?.data || [];
            setTickets(data);
            setError(null);
        } catch (e) {
            setError("Erreur lors du chargement des tickets. Assurez-vous d'être connecté.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTicket = async (ticket: Ticket, e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        try {
            const currentUserId = user?.id || user?._id;
            const createdById = ticket.createdBy && (ticket.createdBy._id || ticket.createdBy);
            if (!currentUserId || createdById !== currentUserId) {
                setDeleteFeedback({ type: 'danger', text: "Vous n'avez pas l'autorisation de supprimer ce ticket." });
                setTimeout(() => setDeleteFeedback(null), 4000);
                return;
            }
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/api/tickets/${ticket._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(prev => prev.filter(t => t._id !== ticket._id));
            setDeleteFeedback({ type: 'success', text: "Ticket supprimé avec succès." });
            setTimeout(() => setDeleteFeedback(null), 3000);
        } catch (err) {
            setDeleteFeedback({ type: 'danger', text: "Erreur lors de la suppression du ticket." });
            setTimeout(() => setDeleteFeedback(null), 4000);
        }
    };

    const handleEditTicket = (ticket: Ticket, e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        try {
            const currentUserId = user?.id || user?._id;
            const createdById = ticket.createdBy && (ticket.createdBy._id || ticket.createdBy);
            if (!currentUserId || createdById !== currentUserId) {
                setDeleteFeedback({ type: 'danger', text: "Vous n'avez pas l'autorisation de modifier ce ticket." });
                setTimeout(() => setDeleteFeedback(null), 4000);
                return;
            }
            window.dispatchEvent(new CustomEvent('ticket:openEdit', { detail: { ticket } }));
        } catch {}
    };

    useEffect(() => {
        const onCreated = (e: any) => {
            setRecentAddSuccess("Ticket ajouté avec succès !");
            // Optionnel: effacer le message après quelques secondes
            setTimeout(() => setRecentAddSuccess(null), 4000);
            try {
                const created = e?.detail?.ticket?.data;
                if (created) {
                    setTickets(prev => [created, ...prev]);
                }
            } catch {}
        };
        const onUpdated = (e: any) => {
            try {
                const updated = e?.detail?.ticket;
                if (updated && updated._id) {
                    setTickets(prev => prev.map(t => t._id === updated._id ? { ...t, ...updated } : t));
                    setRecentAddSuccess("Ticket mis à jour avec succès !");
                    setTimeout(() => setRecentAddSuccess(null), 4000);
                }
            } catch {}
        };
        window.addEventListener("ticket:created" as any, onCreated as any);
        window.addEventListener("ticket:updated" as any, onUpdated as any);
        return () => {
            window.removeEventListener("ticket:created" as any, onCreated as any);
            window.removeEventListener("ticket:updated" as any, onUpdated as any);
        };
    }, []);

    useEffect(() => {
        fetchTickets();
    }, []);

    const [Areachart] = useState<any>({
        series: [
          {
            name: "Messages",
            data: [8, 5, 6, 3, 4, 6, 7, 3, 8, 6, 4, 7],
          },
        ],
    
        chart: {
          type: "bar",
          width: 70,
          height: 70,
          toolbar: {
            show: false,
          },
          zoom: {
            enabled: false,
          },
          dropShadow: {
            enabled: false,
            top: 3,
            left: 14,
            blur: 4,
            opacity: 0.12,
            color: "#fff",
          },
          sparkline: {
            enabled: !0,
          },
        },
        markers: {
          size: 0,
          colors: ["#F26522"],
          strokeColors: "#fff",
          strokeWidth: 2,
          hover: {
            size: 7,
          },
        },
        plotOptions: {
          bar: {
            horizontal: !1,
            columnWidth: "35%",
            endingShape: "rounded",
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          show: !0,
          width: 2.5,
          curve: "smooth",
        },
        colors: ["#FF6F28"],
        xaxis: {
          categories: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
          ],
          labels: {
            show: false,
          },
        },
        tooltip: {
          show: false,
          theme: "dark",
          fixed: {
            enabled: false,
          },
          x: {
            show: false,
          },
    
          marker: {
            show: false,
          },
        },
      });
      const [Areachart1] = useState<any>({
        series: [{
            name: "Messages",
            data: [8,5,6,3,4,6,7,3,8,6,4,7]
          }],
    
          chart: {
            type: 'bar',
            width: 70,
            height:70,
            toolbar: {
              show: false
            },
            zoom: {
              enabled: false
            },
            dropShadow: {
              enabled: false,
              top: 3,
              left: 14,
              blur: 4,
              opacity: .12,
              color: "#fff"
            },
            sparkline: {
              enabled: !0
            }
          },
          markers: {
            size: 0,
            colors: ["#F26512"],
            strokeColors: "#fff",
            strokeWidth: 2,
            hover: {
              size: 7
            }
          },
          plotOptions: {
            bar: {
              horizontal: !1,
              columnWidth: "35%",
              endingShape: "rounded"
            }
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            show: !0,
            width: 2.5,
            curve: "smooth"
          },
          colors: ["#AB47BC"],
          xaxis: {
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
            labels: {
              show: false,}
          },
          tooltip: {
            show:false,
            theme: "dark",
            fixed: {
              enabled: false
            },
            x: {
              show: false
            },
    
            marker: {
              show: false
            }
          }
      });
      const [Areachart2] = useState<any>({
        series: [{
            name: "Messages",
            data: [8,5,6,3,4,6,7,3,8,6,4,7]
          }],
    
          chart: {
            type: 'bar',
            width: 70,
            height:70,
            toolbar: {
              show: false
            },
            zoom: {
              enabled: false
            },
            dropShadow: {
              enabled: false,
              top: 3,
              left: 14,
              blur: 4,
              opacity: .12,
              color: "#fff"
            },
            sparkline: {
              enabled: !0
            }
          },
          markers: {
            size: 0,
            colors: ["#F26522"],
            strokeColors: "#fff",
            strokeWidth: 2,
            hover: {
              size: 7
            }
          },
          plotOptions: {
            bar: {
              horizontal: !1,
              columnWidth: "35%",
              endingShape: "rounded"
            }
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            show: !0,
            width: 2.5,
            curve: "smooth"
          },
          colors: ["#02C95A"],
          xaxis: {
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
            labels: {
              show: false,}
          },
          tooltip: {
            show:false,
            theme: "dark",
            fixed: {
              enabled: false
            },
            x: {
              show: false
            },
    
            marker: {
              show: false
            }
          }
      });
      const [Areachart3] = useState<any>({
        series: [{
            name: "Messages",
            data: [8,5,6,3,4,6,7,3,8,6,4,7]
          }],
    
          chart: {
            type: 'bar',
            width: 70,
            height:70,
            toolbar: {
              show: false
            },
            zoom: {
              enabled: false
            },
            dropShadow: {
              enabled: false,
              top: 3,
              left: 14,
              blur: 4,
              opacity: .12,
              color: "#fff"
            },
            sparkline: {
              enabled: !0
            }
          },
          markers: {
            size: 0,
            colors: ["#F26522"],
            strokeColors: "#fff",
            strokeWidth: 2,
            hover: {
              size: 7
            }
          },
          plotOptions: {
            bar: {
              horizontal: !1,
              columnWidth: "35%",
              endingShape: "rounded"
            }
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            show: !0,
            width: 2.5,
            curve: "smooth"
          },
          colors: ["#0DCAF0"],
          xaxis: {
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
            labels: {
              show: false,}
          },
          tooltip: {
            show:false,
            theme: "dark",
            fixed: {
              enabled: false
            },
            x: {
              show: false
            },
    
            marker: {
              show: false
            }
          }
      });

  return (
      <>
        {/* Page Wrapper */}
        <div className="page-wrapper">
          <div className="content">
            {deleteFeedback && (
              <div className={`alert alert-${deleteFeedback.type} d-flex align-items-center`} role="alert">
                <i className={`ti ${deleteFeedback.type === 'danger' ? 'ti-alert-triangle' : 'ti-check'} me-2`} />
                <div>{deleteFeedback.text}</div>
              </div>
            )}
            {recentAddSuccess && (
              <div className="alert alert-success d-flex align-items-center" role="alert">
                <i className="ti ti-check me-2" />
                <div>{recentAddSuccess}</div>
              </div>
            )}
            {error && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="ti ti-alert-triangle me-2" />
                <div>{error}</div>
              </div>
            )}
            {/* Breadcrumb */}
            <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
              <div className="my-auto mb-2">
                <h2 className="mb-1">Tickets</h2>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={routes.adminDashboard}>
                        <i className="ti ti-smart-home" />
                      </Link>
                    </li>
                    <li className="breadcrumb-item">Employee</li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Tickets Grid
                    </li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
                <div className="me-2 mb-2">
                  <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                    <Link to={routes.tickets} className="btn btn-icon btn-sm me-1">
                      <i className="ti ti-list-tree" />
                    </Link>
                    <Link
                      to={routes.ticketGrid}
                      className="btn btn-icon btn-sm active bg-primary text-white"
                    >
                      <i className="ti ti-layout-grid" />
                    </Link>
                  </div>
                </div>
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
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          <i className="ti ti-file-type-pdf me-1" />
                          Export as PDF
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          <i className="ti ti-file-type-xls me-1" />
                          Export as Excel{" "}
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
            {/* Success message on update */}
            
            <div className="row">
              <div className="col-xl-3 col-md-6 d-flex">
                <div className="card flex-fill">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-6 d-flex">
                        <div className="flex-fill">
                          <div className="border border-dashed border-primary rounded-circle d-inline-flex align-items-center justify-content-center p-1 mb-3">
                            <span className="avatar avatar-lg avatar-rounded bg-primary-transparent ">
                              <i className="ti ti-ticket fs-20" />
                            </span>
                          </div>
                          <p className="fw-medium fs-12 mb-1">New Tickets</p>
                          <h4>{newTicketsCount}</h4>
                        </div>
                      </div>
                      <div className="col-6 text-end d-flex">
                        <div className="d-flex flex-column justify-content-between align-items-end">
                          <span className="badge bg-transparent-purple d-inline-flex align-items-center mb-3">
                            <i className="ti ti-arrow-wave-right-down me-1" />
                            +19.01%
                          </span>
                          <ReactApexChart
                            options={Areachart}
                            series={Areachart.series}
                            type="bar"
                            height={70}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 d-flex">
                <div className="card flex-fill">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-6 d-flex">
                        <div className="flex-fill">
                          <div className="border border-dashed border-purple rounded-circle d-inline-flex align-items-center justify-content-center p-1 mb-3">
                            <span className="avatar avatar-lg avatar-rounded bg-transparent-purple">
                              <i className="ti ti-folder-open fs-20" />
                            </span>
                          </div>
                          <p className="fw-medium fs-12 mb-1">Open Tickets</p>
                          <h4>{openTicketsCount}</h4>
                        </div>
                      </div>
                      <div className="col-6 text-end d-flex">
                        <div className="d-flex flex-column justify-content-between align-items-end">
                          <span className="badge bg-transparent-dark text-dark d-inline-flex align-items-center mb-3">
                            <i className="ti ti-arrow-wave-right-down me-1" />
                            +19.01%
                          </span>
                          <ReactApexChart
                            options={Areachart1}
                            series={Areachart1.series}
                            type="bar"
                            height={70}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 d-flex">
                <div className="card flex-fill">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-6 d-flex">
                        <div className="flex-fill">
                          <div className="border border-dashed border-success rounded-circle d-inline-flex align-items-center justify-content-center p-1 mb-3">
                            <span className="avatar avatar-lg avatar-rounded bg-success-transparent">
                              <i className="ti ti-checks fs-20" />
                            </span>
                          </div>
                          <p className="fw-medium fs-12 mb-1">Solved Tickets</p>
                          <h4>{solvedTicketsCount}</h4>
                        </div>
                      </div>
                      <div className="col-6 text-end d-flex">
                        <div className="d-flex flex-column justify-content-between align-items-end">
                          <span className="badge bg-info-transparent d-inline-flex align-items-center mb-3">
                            <i className="ti ti-arrow-wave-right-down me-1" />
                            +19.01%
                          </span>
                          <ReactApexChart
                            options={Areachart2}
                            series={Areachart2.series}
                            type="bar"
                            height={70}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 d-flex">
                <div className="card flex-fill">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-6 d-flex">
                        <div className="flex-fill">
                          <div className="border border-dashed border-info rounded-circle d-inline-flex align-items-center justify-content-center p-1 mb-3">
                            <span className="avatar avatar-lg avatar-rounded bg-info-transparent">
                              <i className="ti ti-progress-alert fs-20" />
                            </span>
                          </div>
                          <p className="fw-medium fs-12 mb-1">
                            Pending Tickets
                          </p>
                          <h4>{pendingTicketsCount}</h4>
                        </div>
                      </div>
                      <div className="col-6 text-end d-flex">
                        <div className="d-flex flex-column justify-content-between align-items-end">
                          <span className="badge bg-secondary-transparent d-inline-flex align-items-center mb-3">
                            <i className="ti ti-arrow-wave-right-down me-1" />
                            +19.01%
                          </span>
                          <ReactApexChart
                            options={Areachart3}
                            series={Areachart3.series}
                            type="bar"
                            height={70}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                  <h5>Ticket Grid</h5>
                  <div className="d-flex align-items-center flex-wrap row-gap-3">
                    <div className="dropdown me-2">
                      <Link
                        to="#"
                        className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        Priority
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Priority
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            High
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Low
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Medium
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="dropdown me-2">
                      <Link
                        to="#"
                        className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        Select Status
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Open
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            On Hold
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Reopened
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        Sort By : Last 7 Days
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Recently Added
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Ascending
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Desending
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Last Month
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Last 7 Days
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              {isLoading && (
                <div className="col-12">
                  <div className="alert alert-info">Chargement des tickets...</div>
                      </div>
              )}
              {!isLoading && tickets.length === 0 && (
                <div className="col-12">
                  <div className="alert alert-warning">Aucun ticket trouvé.</div>
                      </div>
              )}
              {tickets.map((t, index) => {
                const prBadge = t.priority === "High" ? "bg-outline-danger" : t.priority === "Low" ? "bg-outline-secondary" : "bg-outline-warning";
                const statusBadge = "bg-pink-transparent";
                const ticketNum = String(index + 1).padStart(3, '0');
                return (
                  <div className="col-xl-3 col-lg-4 col-md-6" key={t._id || index}>
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                      <div>
                        <Link
                          to={`/tickets/ticket-details/${t._id || ""}`}
                          className="avatar avatar-xl avatar-rounded online border p-1 border-primary rounded-circle"
                        >
                          <ImageWithBasePath
                                src="assets/img/users/user-49.jpg"
                            className="img-fluid h-auto w-auto"
                            alt="img"
                          />
                        </Link>
                      </div>
                      <div className="dropdown">
                        <button
                          className="btn btn-icon btn-sm rounded-circle"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i className="ti ti-dots-vertical" />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          <li>
                            <Link
                              className="dropdown-item rounded-1"
                              to="#"
                              onClick={(e)=> handleEditTicket(t, e)}
                            >
                              <i className="ti ti-edit me-1" />
                              Edit
                            </Link>
                          </li>
                          <li>
                            <Link
                                  className="dropdown-item rounded-1 text-danger"
                              to="#"
                                  onClick={(e) => handleDeleteTicket(t, e)}
                            >
                              <i className="ti ti-trash me-1" />
                              Delete
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="text-center mb-3">
                      <h6 className="mb-1">
                            <Link to={`/tickets/ticket-details/${t._id || ""}`}>{t.title || "Ticket"}</Link>
                      </h6>
                      <span className="badge bg-info-transparent fs-10 fw-medium">
                            {`Tic - ${ticketNum}`}
                      </span>
                    </div>
                    <div className="d-flex flex-column">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span>Category</span>
                            <h6 className="fw-medium">{t.category || "General"}</h6>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span>Status</span>
                            <span className={`badge ${statusBadge} d-inline-flex align-items-center fs-10 fw-medium`}>
                          <i className="ti ti-circle-filled fs-5 me-1" />
                              {t.status || "Open"}
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <span>Priority</span>
                            <span className={`badge ${prBadge} d-inline-flex align-items-center fs-10 fw-medium`}>
                          <i className="ti ti-circle-filled fs-5 me-1" />
                              {t.priority}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-3">
                      <div>
                        <p className="mb-1 fs-12">Assigned To</p>
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-xs avatar-rounded me-2">
                            <ImageWithBasePath
                              src="assets/img/profiles/avatar-05.jpg"
                              alt="Img"
                            />
                          </span>
                              <h6 className="fw-normal">{t.createdByUsername || "-"}</h6>
                        </div>
                      </div>
                      <div className="icons-social d-flex align-items-center">
                        <Link
                          to="#"
                          className="avatar avatar-rounded avatar-sm bg-primary-transparent me-2"
                        >
                          <i className="ti ti-message text-primary" />
                        </Link>
                        <Link
                          to="#"
                          className="avatar avatar-rounded avatar-sm bg-light"
                        >
                          <i className="ti ti-phone" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                );
              })}
              
              
              
              
              
              
              <div className="col-md-12">
                <div className="text-center mb-4">
                  <Link to="#" className="btn btn-primary">
                    <i className="ti ti-loader-3 me-1" />
                    Load More
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
            <p className="mb-0">2014 - 2025 © SmartHR.</p>
            <p>
              Designed &amp; Developed By{" "}
              <Link to="#" className="text-primary">
                Dreams
              </Link>
            </p>
          </div>
        </div>
        {/* /Page Wrapper */}

        <TicketGridModal />
      </>      
  );
};

export default TicketGrid;
