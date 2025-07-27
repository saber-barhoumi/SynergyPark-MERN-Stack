import React, { useEffect, useState, useRef } from "react";
import { useUser } from "../../../hooks/useUser";
import { Chart as PrimeChart } from "primereact/chart";
import ReactApexChart from "react-apexcharts";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { Link } from "react-router-dom";

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
    map: useRef<HTMLDivElement>(null),
    stackedDomain: useRef<HTMLDivElement>(null),
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

  // Pie/Donut: Activity Domain
  const activityDomainCounts = countByField('activityDomain');
  const activityDomainData = {
    labels: Object.keys(activityDomainCounts),
    datasets: [
      {
        data: Object.values(activityDomainCounts),
        backgroundColor: [
          '#42A5F5', '#66BB6A', '#FF7043', '#FFEB3B', '#AB47BC', '#26A69A', '#FFA726', '#8D6E63', '#789262', '#D4E157', '#5C6BC0', '#EC407A', '#BDBDBD'
        ],
      },
    ],
  };

  // Donut: Project Progress
  const projectProgressCounts = countByField('projectProgress');
  const projectProgressData = {
    labels: Object.keys(projectProgressCounts),
    datasets: [
      {
        data: Object.values(projectProgressCounts),
        backgroundColor: ['#42A5F5', '#66BB6A', '#FF7043', '#FFEB3B', '#AB47BC', '#26A69A'],
      },
    ],
  };

  // Bar: Staff Range
  const staffRangeCounts = countByField('staffRange');
  const staffRangeData = {
    labels: Object.keys(staffRangeCounts),
    datasets: [
      {
        label: 'Companies',
        data: Object.values(staffRangeCounts),
        backgroundColor: '#42A5F5',
      },
    ],
  };

  // Horizontal Bar: Support Needed
  const supportNeededCounts = countByField('supportNeeded');
  const supportNeededData = {
    labels: Object.keys(supportNeededCounts),
    datasets: [
      {
        label: 'Companies',
        data: Object.values(supportNeededCounts),
        backgroundColor: '#66BB6A',
      },
    ],
  };

  // Gauge: Approval Rate
  const total = profiles.length;
  const approved = profiles.filter((p) => p.requestStatus === 'APPROVED').length;
  const approvalRate = total ? Math.round((approved / total) * 100) : 0;

  // Timeline: Company Age
  const companyAges = profiles.map((p) => p.companyCreationDate ? new Date(p.companyCreationDate) : null).filter(Boolean) as Date[];
  companyAges.sort((a, b) => a.getTime() - b.getTime());
  const timelineLabels = companyAges.map((d) => d.getFullYear().toString());
  const timelineCounts: Record<string, number> = {};
  timelineLabels.forEach((year) => {
    timelineCounts[year] = (timelineCounts[year] || 0) + 1;
  });
  const timelineData = {
    labels: Object.keys(timelineCounts),
    datasets: [
      {
        label: 'Companies Founded',
        data: Object.values(timelineCounts),
        backgroundColor: '#AB47BC',
      },
    ],
  };

  // Map: Company Locations (for now, just show a list)
  const locations = profiles.map((p) => p.address).filter(Boolean);

  // Stacked Bar: Domain vs Sub-Domain
  const domainSubdomain: Record<string, Record<string, number>> = {};
  profiles.forEach((p) => {
    const domain = p.activityDomain || 'Unknown';
    const sub = p.activitySubDomain || 'Unknown';
    if (!domainSubdomain[domain]) domainSubdomain[domain] = {};
    domainSubdomain[domain][sub] = (domainSubdomain[domain][sub] || 0) + 1;
  });
  const stackedLabels = Object.keys(domainSubdomain);
  const subdomainKeys = Array.from(new Set(profiles.map((p) => p.activitySubDomain || 'Unknown')));
  const stackedDatasets = subdomainKeys.map((sub) => ({
    label: sub,
    data: stackedLabels.map((domain) => domainSubdomain[domain][sub] || 0),
    backgroundColor: '#' + Math.floor(Math.random()*16777215).toString(16),
  }));
  const stackedData = {
    labels: stackedLabels,
    datasets: stackedDatasets,
  };

  if (userLoading || loading) {
    return <div className="text-center mt-5">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="alert alert-danger mt-5 text-center">{error}</div>;
  }

  return (
    <div className="page-wrapper cardhead">
      <div className="content">
        <div className="page-header">
          <div className="row">
            <div className="col-sm-12">
              <h3 className="page-title">Company Overview Dashboard</h3>
              <p className="lead">Analytics & Statistics for S2T Users</p>
            </div>
          </div>
        </div>
        <div className="row">
          {/* Pie Chart - Activity Domain Distribution */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.activityDomain}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Activity Domain Distribution</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={() => downloadChart(chartRefs.activityDomain, 'activity-domain-pie')}>Download</button>
              </div>
              <div className="card-body">
                <Doughnut data={activityDomainData} />
              </div>
            </div>
          </div>
          {/* Donut Chart - Project Progress Stages */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.projectProgress}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Project Progress Stages</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={() => downloadChart(chartRefs.projectProgress, 'project-progress-donut')}>Download</button>
              </div>
              <div className="card-body">
                <Doughnut data={projectProgressData} />
              </div>
            </div>
          </div>
          {/* Bar Chart - Staff Range Distribution */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.staffRange}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Staff Range Distribution</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={() => downloadChart(chartRefs.staffRange, 'staff-range-bar')}>Download</button>
              </div>
              <div className="card-body">
                <Bar data={staffRangeData} />
              </div>
            </div>
          </div>
          {/* Horizontal Bar Chart - Support Needed Categories */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.supportNeeded}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Support Needed Categories</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={() => downloadChart(chartRefs.supportNeeded, 'support-needed-bar')}>Download</button>
              </div>
              <div className="card-body">
                <Bar data={supportNeededData} options={{ indexAxis: 'y' }} />
              </div>
            </div>
          </div>
          {/* Gauge Chart - Approval Rate */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.approvalRate}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Approval Rate</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={() => downloadChart(chartRefs.approvalRate, 'approval-rate-gauge')}>Download</button>
              </div>
              <div className="card-body text-center">
                <ReactApexChart
                  options={{
                    chart: { type: 'radialBar' },
                    plotOptions: {
                      radialBar: {
                        hollow: { size: '70%' },
                        dataLabels: {
                          name: { show: false },
                          value: { fontSize: '32px', show: true },
                        },
                      },
                    },
                    labels: ['Approval Rate'],
                    colors: ['#66BB6A'],
                  }}
                  series={[approvalRate]}
                  type="radialBar"
                  height={300}
                />
                <div className="mt-2">{approvalRate}% Approved</div>
              </div>
            </div>
          </div>
          {/* Timeline Chart - Company Age */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.companyAge}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Company Age Timeline</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={() => downloadChart(chartRefs.companyAge, 'company-age-timeline')}>Download</button>
              </div>
              <div className="card-body">
                <Bar data={timelineData} />
              </div>
            </div>
          </div>
          {/* Map Visualization - Company Locations */}
          <div className="col-md-6">
            <div className="card" ref={chartRefs.map}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Company Locations</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={() => downloadChart(chartRefs.map, 'company-locations-map')}>Download</button>
              </div>
              <div className="card-body">
                {/* For demo: just show a list. For real map, integrate a map library. */}
                <ul>
                  {locations.map((loc, idx) => (
                    <li key={idx}>{loc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {/* Stacked Bar Chart - Domain vs Sub-Domain */}
          <div className="col-md-12">
            <div className="card" ref={chartRefs.stackedDomain}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Domain vs Sub-Domain</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={() => downloadChart(chartRefs.stackedDomain, 'domain-vs-subdomain-stacked')}>Download</button>
              </div>
              <div className="card-body">
                <Bar data={stackedData} options={{ plugins: { legend: { position: 'top' } }, responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
        <p className="mb-0">2014 - 2025 © SmartHR.</p>
        <p>
          Designed &amp; Developed By <Link to="#" className="text-primary">Dreams</Link>
        </p>
      </div>
    </div>
  );
};

export default CompanyOverviewDashboard; 