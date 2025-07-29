import React, { useEffect, useState, useRef } from "react";
import { useUser } from "../../../hooks/useUser";
import { Chart as PrimeChart } from "primereact/chart";
import ReactApexChart from "react-apexcharts";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { Link } from "react-router-dom";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CompanyOverviewDashboard = () => {
  const { user, loading: userLoading } = useUser();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chart refs for download
  const chartRefs = {
    activityDomain: useRef<HTMLDivElement>(null),
    projectProgress: useRef<HTMLDivElement>(null),
    staffRange: useRef<HTMLDivElement>(null),
    supportNeeded: useRef<HTMLDivElement>(null),
    approvalRate: useRef<HTMLDivElement>(null),
    companyAge: useRef<HTMLDivElement>(null),
    stackedDomain: useRef<HTMLDivElement>(null),
    revenueTrend: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!userLoading && user && user.role === 'S2T') {
      fetchAnalytics();
    }
    if (!userLoading && user && user.role !== 'S2T') {
      setError('You are not authorized to view this page.');
      setLoading(false);
    }
  }, [user, userLoading]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/company-profile/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setProfiles(data.data);
      } else {
        setError(data.message || 'Failed to fetch analytics data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Download chart as image
  const downloadChart = async (ref: React.RefObject<HTMLDivElement>, name: string) => {
    if (ref.current) {
      const canvas = await html2canvas(ref.current);
      canvas.toBlob((blob: Blob | null) => {
        if (blob) saveAs(blob, `${name}.png`);
      });
    }
  };

  // Data aggregation for charts
  const countByField = (field: string) => {
    const counts: Record<string, number> = {};
    profiles.forEach((p) => {
      const value = p[field] || 'Unknown';
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  };

  // ChartJS Data
  const activityDomainCounts = countByField('activityDomain');
  const activityDomainData = {
    labels: Object.keys(activityDomainCounts),
    datasets: [
      {
        data: Object.values(activityDomainCounts),
        backgroundColor: [
          '#42A5F5', '#66BB6A', '#FF7043', '#FFEB3B', '#AB47BC', '#26A69A', '#FFA726', '#8D6E63', '#789262', '#D4E157', '#5C6BC0', '#EC407A', '#BDBDBD'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      },
    ],
  };

  const projectProgressCounts = countByField('projectProgress');
  const projectProgressData = {
    labels: Object.keys(projectProgressCounts),
    datasets: [
      {
        data: Object.values(projectProgressCounts),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      },
    ],
  };

  const staffRangeCounts = countByField('staffRange');
  const staffRangeData = {
    labels: Object.keys(staffRangeCounts),
    datasets: [
      {
        label: 'Number of Companies',
        data: Object.values(staffRangeCounts),
        backgroundColor: '#42A5F5',
        borderColor: '#42A5F5',
        borderWidth: 2
      }
    ]
  };

  // ApexCharts Data
  const approvalRateData = {
    series: [profiles.filter(p => p.requestStatus === 'APPROVED').length, 
             profiles.filter(p => p.requestStatus === 'PENDING').length,
             profiles.filter(p => p.requestStatus === 'REJECTED').length],
    options: {
      chart: {
        height: 350,
        type: 'radialBar' as const,
        toolbar: { show: false }
      },
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: { fontSize: '22px' },
            value: { fontSize: '16px' },
            total: {
              show: true,
              label: 'Total',
              formatter: function () {
                return profiles.length.toString();
              }
            }
          }
        }
      },
      labels: ['Approved', 'Pending', 'Rejected'],
      colors: ['#66BB6A', '#FFA726', '#EF5350']
    }
  };

  const revenueTrendData = {
    series: [{
      name: 'Revenue Growth',
      data: [30, 40, 35, 50, 49, 60, 70, 91, 125]
    }],
    options: {
      chart: {
        height: 350,
        type: 'line' as const,
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'straight' as const },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        }
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
      },
      colors: ['#42A5F5']
    }
  };

  // PrimeReact Chart Data
  const stackedDomainData = {
    labels: Object.keys(activityDomainCounts),
    datasets: [
      {
        label: 'Approved',
        data: Object.keys(activityDomainCounts).map(domain => 
          profiles.filter(p => p.activityDomain === domain && p.requestStatus === 'APPROVED').length
        ),
        backgroundColor: '#66BB6A'
      },
      {
        label: 'Pending',
        data: Object.keys(activityDomainCounts).map(domain => 
          profiles.filter(p => p.activityDomain === domain && p.requestStatus === 'PENDING').length
        ),
        backgroundColor: '#FFA726'
      },
      {
        label: 'Rejected',
        data: Object.keys(activityDomainCounts).map(domain => 
          profiles.filter(p => p.activityDomain === domain && p.requestStatus === 'REJECTED').length
        ),
        backgroundColor: '#EF5350'
      }
    ]
  };

  const supportNeededData = {
    labels: Object.keys(countByField('supportNeeded')),
    datasets: [
      {
        data: Object.values(countByField('supportNeeded')),
        backgroundColor: ['#FF7043', '#66BB6A', '#42A5F5', '#FFEB3B', '#AB47BC']
      }
    ]
  };

  if (loading) {
    return (
      <div className="page-wrapper cardhead">
        <div className="content">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Tableau de Bord - Vue d'ensemble des Entreprises</h3>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                  <p className="mt-3">Chargement des données analytiques...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper cardhead">
        <div className="content">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Tableau de Bord - Vue d'ensemble des Entreprises</h3>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper cardhead">
      <div className="content">
        {/* Page Header */}
        <div className="page-header">
          <div className="row">
            <div className="col-sm-12">
              <h3 className="page-title">Tableau de Bord - Vue d'ensemble des Entreprises</h3>
              <p className="text-muted">Analytique et indicateurs pour toutes les entreprises</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h4 className="mb-0">{profiles.length}</h4>
                    <p className="mb-0">Entreprises au total</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-building fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h4 className="mb-0">{profiles.filter(p => p.requestStatus === 'APPROVED').length}</h4>
                    <p className="mb-0">Approuvées</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-check-circle fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h4 className="mb-0">{profiles.filter(p => p.requestStatus === 'PENDING').length}</h4>
                    <p className="mb-0">En attente</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-clock fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-danger text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h4 className="mb-0">{profiles.filter(p => p.requestStatus === 'REJECTED').length}</h4>
                    <p className="mb-0">Rejetées</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-times-circle fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="row">
          {/* Activity Domain Distribution - ChartJS Pie */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.activityDomain}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Répartition par Domaine d'Activité</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.activityDomain, 'repartition-domaine-activite')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Pie 
                    data={activityDomainData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' },
                        title: { display: true, text: "Entreprises par Domaine d'Activité" }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Project Progress - ChartJS Doughnut */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.projectProgress}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Statut d'Avancement du Projet</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.projectProgress, 'statut-avancement-projet')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Doughnut 
                    data={projectProgressData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' },
                        title: { display: true, text: 'Entreprises par Avancement du Projet' }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="row">
          {/* Staff Range - ChartJS Bar */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.staffRange}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Répartition par Taille d'Équipe</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.staffRange, 'repartition-taille-equipe')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Bar 
                    data={staffRangeData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Entreprises par Taille d’Équipe' }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Approval Rate - ApexCharts Radial */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.approvalRate}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Vue d'Ensemble des Statuts</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.approvalRate, 'vue-ensemble-statuts')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <ReactApexChart
                  options={{
                    ...approvalRateData.options,
                    labels: ['Approuvées', 'En attente', 'Rejetées'],
                  }}
                  series={approvalRateData.series}
                  type="radialBar"
                  height={300}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="row">
          {/* Revenue Trend - ApexCharts Line */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.revenueTrend}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Tendance de Croissance du Chiffre d'Affaires</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.revenueTrend, 'tendance-croissance-chiffre-affaires')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <ReactApexChart
                  options={{
                    ...revenueTrendData.options,
                    xaxis: {
                      ...revenueTrendData.options.xaxis,
                      categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep']
                    },
                  }}
                  series={revenueTrendData.series}
                  type="line"
                  height={300}
                />
              </div>
            </div>
          </div>

          {/* Stacked Domain - PrimeReact Bar */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.stackedDomain}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Statut par Domaine (Empilé)</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.stackedDomain, 'statut-par-domaine-empile')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <PrimeChart 
                  type="bar" 
                  data={stackedDomainData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: { display: true, text: 'Entreprises par Domaine et Statut' }
                    },
                    scales: {
                      x: { stacked: true },
                      y: { stacked: true, beginAtZero: true }
                    }
                  }}
                  style={{ height: '300px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Support Needed - PrimeReact Pie */}
        <div className="row">
          <div className="col-md-6">
            <div className="card" ref={chartRefs.supportNeeded}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Répartition des Besoins en Support</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.supportNeeded, 'repartition-besoins-support')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <PrimeChart 
                  type="pie" 
                  data={supportNeededData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                      title: { display: true, text: 'Entreprises par Besoins en Support' }
                    }
                  }}
                  style={{ height: '300px' }}
                />
              </div>
            </div>
          </div>

          {/* Companies List */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Toutes les Entreprises - Cliquez pour voir les détails</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Nom de l'Entreprise</th>
                        <th>Domaine</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.slice(0, 10).map((profile: any, index: number) => (
                        <tr key={index}>
                          <td>{profile.companyName || 'N/A'}</td>
                          <td>{profile.activityDomain || 'N/A'}</td>
                          <td>
                            <span className={`badge bg-${
                              profile.requestStatus === 'APPROVED' ? 'success' : 
                              profile.requestStatus === 'REJECTED' ? 'danger' : 'warning'
                            }`}>
                              {profile.requestStatus === 'APPROVED' ? 'Approuvée' : profile.requestStatus === 'REJECTED' ? 'Rejetée' : 'En attente'}
                            </span>
                          </td>
                          <td>
                            <Link
                              to={`/company-detail-dashboard/${profile._id}`}
                              className="btn btn-sm btn-primary"
                            >
                              <i className="fas fa-eye me-1"></i>Voir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {profiles.length > 10 && (
                  <div className="text-center mt-3">
                    <small className="text-muted">Affichage des 10 premières entreprises sur {profiles.length}</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyOverviewDashboard; 