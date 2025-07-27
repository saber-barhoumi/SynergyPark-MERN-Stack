import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../../../hooks/useUser";
import { Chart as PrimeChart } from "primereact/chart";
import ReactApexChart from "react-apexcharts";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";

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

const CompanyDetailDashboard = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chart refs for download
  const chartRefs = {
    companyOverview: useRef<HTMLDivElement>(null),
    progressTimeline: useRef<HTMLDivElement>(null),
    staffGrowth: useRef<HTMLDivElement>(null),
    financialMetrics: useRef<HTMLDivElement>(null),
    marketAnalysis: useRef<HTMLDivElement>(null),
    riskAssessment: useRef<HTMLDivElement>(null),
    revenueTrend: useRef<HTMLDivElement>(null),
    performanceRadar: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!userLoading && user && user.role === 'S2T') {
      fetchCompanyProfile();
    }
    if (!userLoading && user && user.role !== 'S2T') {
      setError('You are not authorized to view this page.');
      setLoading(false);
    }
  }, [user, userLoading, companyId]);

  const fetchCompanyProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/company-profile/detail/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setCompanyProfile(data.data);
      } else {
        setError(data.message || 'Failed to fetch company profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch company profile');
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

  // Helper: Download entire page as PDF
  const downloadAsPDF = async () => {
    if (!chartRefs.companyOverview.current) return;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const canvas = await html2canvas(chartRefs.companyOverview.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`${companyProfile?.companyName || 'company'}-report.pdf`);
  };

  // Helper: Download entire page as image
  const downloadAsImage = async () => {
    if (!chartRefs.companyOverview.current) return;
    
    const canvas = await html2canvas(chartRefs.companyOverview.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    canvas.toBlob((blob: Blob | null) => {
      if (blob) saveAs(blob, `${companyProfile?.companyName || 'company'}-dashboard.png`);
    });
  };

  // Generate beautiful chart data
  const generateChartData = () => {
    if (!companyProfile) {
      return {
        progressData: {
          labels: [],
          datasets: []
        },
        staffData: {
          labels: [],
          datasets: []
        },
        financialData: {
          labels: [],
          datasets: []
        },
        marketData: {
          labels: [],
          datasets: []
        },
        riskData: {
          labels: [],
          datasets: []
        }
      };
    }

    // ChartJS Data
    const progressData = {
      labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024'],
      datasets: [
        {
          label: 'Development Progress',
          data: [20, 35, 50, 75, 90],
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66, 165, 245, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    const staffData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Team Size',
          data: [1, 2, 3, 5, 8, 12],
          backgroundColor: '#66BB6A',
          borderColor: '#66BB6A',
          borderWidth: 2
        }
      ]
    };

    const financialData = {
      labels: ['Revenue', 'Funding', 'Expenses', 'Profit'],
      datasets: [
        {
          data: [companyProfile.revenue || 100000, companyProfile.funding || 50000, companyProfile.expenses || 80000, companyProfile.profit || 20000],
          backgroundColor: ['#42A5F5', '#66BB6A', '#FF7043', '#FFEB3B'],
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };

    const marketData = {
      labels: ['Market Share', 'Competition', 'Growth Rate', 'Customer Base'],
      datasets: [
        {
          label: 'Market Metrics',
          data: [15, 25, 40, 60],
          backgroundColor: '#AB47BC',
          borderColor: '#AB47BC',
          borderWidth: 2
        }
      ]
    };

    const riskData = {
      labels: ['Technical Risk', 'Market Risk', 'Financial Risk', 'Operational Risk'],
      datasets: [
        {
          label: 'Risk Level',
          data: [30, 45, 25, 35],
          backgroundColor: '#FF7043',
          borderColor: '#FF7043',
          borderWidth: 2
        }
      ]
    };

    return {
      progressData,
      staffData,
      financialData,
      marketData,
      riskData
    };
  };

  // ApexCharts Data
  const revenueTrendData = {
    series: [{
      name: 'Revenue',
      data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 150, 180, 200]
    }, {
      name: 'Expenses',
      data: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75]
    }],
    options: {
      chart: {
        height: 350,
        type: 'line' as const,
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth' as const, width: 3 },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        }
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      colors: ['#42A5F5', '#FF7043'],
      legend: { position: 'top' as const }
    }
  };

  const performanceRadarData = {
    series: [{
      name: 'Performance Metrics',
      data: [80, 65, 90, 75, 85, 70]
    }],
    options: {
      chart: {
        height: 350,
        type: 'radar' as const,
        toolbar: { show: false }
      },
      stroke: { width: 2 },
      fill: { opacity: 0.25 },
      markers: { size: 0 },
      xaxis: {
        categories: ['Innovation', 'Market Position', 'Financial Health', 'Team Growth', 'Customer Satisfaction', 'Operational Efficiency']
      },
      colors: ['#42A5F5']
    }
  };

  // PrimeReact Chart Data
  const marketShareData = {
    labels: ['Our Company', 'Competitor A', 'Competitor B', 'Competitor C', 'Others'],
    datasets: [
      {
        data: [25, 30, 20, 15, 10],
        backgroundColor: ['#42A5F5', '#66BB6A', '#FF7043', '#FFEB3B', '#AB47BC']
      }
    ]
  };

  const customerSatisfactionData = {
    labels: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
    datasets: [
      {
        label: 'Customer Satisfaction',
        data: [45, 30, 15, 8, 2],
        backgroundColor: '#66BB6A',
        borderColor: '#66BB6A',
        borderWidth: 2
      }
    ]
  };

  const chartData = generateChartData();

  if (loading) {
    return (
      <div className="page-wrapper cardhead">
        <div className="content">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <h3 className="page-title">Company Detail Dashboard</h3>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading company data...</p>
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
                <h3 className="page-title">Company Detail Dashboard</h3>
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
                  <button className="btn btn-primary" onClick={() => navigate(-1)}>
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper cardhead" ref={chartRefs.companyOverview}>
      <div className="content">
        {/* Page Header */}
        <div className="page-header">
          <div className="row">
            <div className="col-sm-12">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="page-title">{companyProfile?.companyName || 'Company'} Dashboard</h3>
                  <p className="text-muted">Detailed analytics and insights</p>
                </div>
                <div className="btn-group">
                  <button className="btn btn-outline-primary" onClick={downloadAsPDF}>
                    <i className="fas fa-file-pdf me-1"></i>Download PDF
                  </button>
                  <button className="btn btn-outline-primary" onClick={downloadAsImage}>
                    <i className="fas fa-image me-1"></i>Download Image
                  </button>
                  <Link to="/company-overview-dashboard" className="btn btn-outline-secondary">
                    <i className="fas fa-arrow-left me-1"></i>Back to Overview
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Info Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h4 className="mb-0">{companyProfile?.activityDomain || 'N/A'}</h4>
                    <p className="mb-0">Activity Domain</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-industry fa-2x"></i>
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
                    <h4 className="mb-0">{companyProfile?.projectProgress || 'N/A'}</h4>
                    <p className="mb-0">Project Progress</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-chart-line fa-2x"></i>
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
                    <h4 className="mb-0">{companyProfile?.staffRange || 'N/A'}</h4>
                    <p className="mb-0">Team Size</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-users fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h4 className="mb-0">{companyProfile?.requestStatus || 'PENDING'}</h4>
                    <p className="mb-0">Status</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-flag fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="row">
          {/* Progress Timeline - ChartJS Line */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.progressTimeline}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Progress Timeline</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.progressTimeline, 'progress-timeline')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Line 
                    data={chartData.progressData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Development Progress Over Time' }
                      },
                      scales: {
                        y: { beginAtZero: true, max: 100 }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Staff Growth - ChartJS Bar */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.staffGrowth}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Team Growth</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.staffGrowth, 'team-growth')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Bar 
                    data={chartData.staffData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Team Size Growth' }
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
        </div>

        {/* Charts Row 2 */}
        <div className="row">
          {/* Financial Metrics - ChartJS Doughnut */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.financialMetrics}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Financial Overview</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.financialMetrics, 'financial-overview')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Doughnut 
                    data={chartData.financialData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' },
                        title: { display: true, text: 'Financial Distribution' }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Market Analysis - ChartJS Bar */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.marketAnalysis}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Market Analysis</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.marketAnalysis, 'market-analysis')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Bar 
                    data={chartData.marketData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Market Performance Metrics' }
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
        </div>

        {/* Charts Row 3 */}
        <div className="row">
          {/* Revenue Trend - ApexCharts Line */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.revenueTrend}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Revenue vs Expenses Trend</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.revenueTrend, 'revenue-expenses-trend')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <ReactApexChart
                  options={revenueTrendData.options}
                  series={revenueTrendData.series}
                  type="line"
                  height={300}
                />
              </div>
            </div>
          </div>

          {/* Performance Radar - ApexCharts Radar */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.performanceRadar}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Performance Radar</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.performanceRadar, 'performance-radar')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <ReactApexChart
                  options={performanceRadarData.options}
                  series={performanceRadarData.series}
                  type="radar"
                  height={300}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 4 */}
        <div className="row">
          {/* Risk Assessment - ChartJS Bar */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.riskAssessment}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Risk Assessment</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => downloadChart(chartRefs.riskAssessment, 'risk-assessment')}
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Bar 
                    data={chartData.riskData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Risk Level Analysis' }
                      },
                      scales: {
                        y: { beginAtZero: true, max: 100 }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Market Share - PrimeReact Pie */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Market Share</h5>
                <button className="btn btn-sm btn-outline-primary">
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <PrimeChart 
                  type="pie" 
                  data={marketShareData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                      title: { display: true, text: 'Market Share Distribution' }
                    }
                  }}
                  style={{ height: '300px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customer Satisfaction - PrimeReact Bar */}
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Customer Satisfaction</h5>
                <button className="btn btn-sm btn-outline-primary">
                  <i className="fas fa-download"></i>
                </button>
              </div>
              <div className="card-body">
                <PrimeChart 
                  type="bar" 
                  data={customerSatisfactionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: 'Customer Satisfaction Levels' }
                    },
                    scales: {
                      y: { beginAtZero: true, max: 100 }
                    }
                  }}
                  style={{ height: '300px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company Details */}
        <div className="row mt-4">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Company Information</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Company Name:</strong></td>
                          <td>{companyProfile?.companyName || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Founder:</strong></td>
                          <td>{companyProfile?.founderName || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Email:</strong></td>
                          <td>{companyProfile?.email || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Activity Domain:</strong></td>
                          <td>{companyProfile?.activityDomain || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Sub Domain:</strong></td>
                          <td>{companyProfile?.activitySubDomain || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Project Progress:</strong></td>
                          <td>{companyProfile?.projectProgress || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Staff Range:</strong></td>
                          <td>{companyProfile?.staffRange || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Support Needed:</strong></td>
                          <td>{companyProfile?.supportNeeded || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Status:</strong></td>
                          <td>
                            <span className={`badge bg-${
                              companyProfile?.requestStatus === 'APPROVED' ? 'success' : 
                              companyProfile?.requestStatus === 'REJECTED' ? 'danger' : 'warning'
                            }`}>
                              {companyProfile?.requestStatus || 'PENDING'}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Address:</strong></td>
                          <td>{companyProfile?.address || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailDashboard; 