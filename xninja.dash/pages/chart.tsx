import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPageTitle } from "../store/themeConfigSlice";
import { useSession } from "next-auth/react";
import Decimal from "decimal.js";
import { IRootState } from '../store';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Dropdown from '../components/Dropdown';
import dynamic from 'next/dynamic';
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});
import Link from 'next/link';
import axios from "axios";

export function roundDown(value: number | string, decimals: number, DOWN?: boolean) {
  let result = new Decimal(value).toFixed(decimals, Decimal.ROUND_DOWN);
  if (DOWN) {
    let adjustment = new Decimal(1).dividedBy(new Decimal(10).pow(decimals));
    result = new Decimal(result).minus(adjustment).toFixed(decimals, Decimal.ROUND_DOWN);
  }
  return result;
}

const Index = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setPageTitle("Home"));
  });
  const { data: session } = useSession();

  const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
  const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  });

  const [chartUsers, setChartUsers] = useState<{ [key: string]: any }>({});

  const [chartUserDay, setChartUserDay] = useState<number>(1);

  useEffect(() => {
    setChartUsers({});

    axios.get('/api/charts/users', { params: { sort_type: chartUserDay } })
      .then(response => setChartUsers(response.data))
      .catch(error => console.log(error));
  }, [chartUserDay]);

  const TotalUsers: any = {
    series: [
      {
        name: 'total_user',
        data: chartUsers?.total_user,
      },
      {
        name: 'revisit_user',
        data: chartUsers?.revisit_user,
      },
      {
        name: 'new_user',
        data: chartUsers?.new_user,
      },
    ],
    options: {
      chart: {
        height: 325,
        type: 'area',
        fontFamily: 'Nunito, sans-serif',
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },

      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        curve: 'smooth',
        width: 2,
        lineCap: 'square',
      },
      dropShadow: {
        enabled: true,
        opacity: 0.2,
        blur: 10,
        left: -7,
        top: 22,
      },
      colors: isDark ? ['#000', '#E7515A', '#1B55E2'] : ['#000', '#E7515A', '#1B55E2'],
      markers: {
        discrete: [
          {
            seriesIndex: 0,
            fillColor: '#000',
            strokeColor: 'transparent',
            size: 7,
          },
          {
            seriesIndex: 2,
            fillColor: '#E7515A',
            strokeColor: 'transparent',
            size: 7,
          },
          {
            seriesIndex: 1,
            fillColor: '#1B55E2',
            strokeColor: 'transparent',
            size: 7,
          },
        ],
      },
      labels: chartUsers.labels?.map((i: number) => new Date(i).toLocaleDateString()),
      xaxis: {
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        crosshairs: {
          show: true,
        },
        labels: {
          offsetX: isRtl ? 2 : 0,
          offsetY: 5,
          style: {
            fontSize: '12px',
            cssClass: 'apexcharts-xaxis-title',
          },
        },
      },
      yaxis: {
        tickAmount: 7,
        labels: {
          formatter: (value: number) => {
            return value.toLocaleString();
          },
          offsetX: isRtl ? -30 : -10,
          offsetY: 0,
          style: {
            fontSize: '12px',
            cssClass: 'apexcharts-yaxis-title',
          },
        },
        opposite: isRtl ? true : false,
      },
      grid: {
        borderColor: isDark ? '#191E3A' : '#E0E6ED',
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '16px',
        markers: {
          width: 10,
          height: 10,
          offsetX: -2,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5,
        },
      },
      tooltip: {
        marker: {
          show: true,
        },
        x: {
          show: false,
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          inverseColors: !1,
          opacityFrom: isDark ? 0.19 : 0.28,
          opacityTo: 0.05,
          stops: isDark ? [100, 100] : [45, 100],
        },
      },
    },
  };

  const [chartClaims, setChartClaims] = useState<{ [key: string]: any }>({});

  const [chartClaimDay, setChartClaimDay] = useState<number>(1);

  useEffect(() => {
    setChartClaims({});

    axios.get('/api/charts/elem_claimed', { params: { sort_type: chartClaimDay } })
      .then(response => setChartClaims(response.data))
      .catch(error => console.log(error));
  }, [chartClaimDay]);

  const TotalELEMClaimed: any = {
    series: [
      {
        name: 'total_amount',
        data: chartClaims?.total_amount,
      },
      {
        name: 'amount',
        data: chartClaims?.amount,
      },
    ],
    options: {
      chart: {
        height: 325,
        type: 'area',
        fontFamily: 'Nunito, sans-serif',
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },

      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        curve: 'smooth',
        width: 2,
        lineCap: 'square',
      },
      dropShadow: {
        enabled: true,
        opacity: 0.2,
        blur: 10,
        left: -7,
        top: 22,
      },
      colors: isDark ? ['#000', '#1B55E2'] : ['#000', '#1B55E2'],
      markers: {
        discrete: [
          {
            seriesIndex: 0,
            fillColor: '#000',
            strokeColor: 'transparent',
            size: 7,
          },
          {
            seriesIndex: 1,
            fillColor: '#1B55E2',
            strokeColor: 'transparent',
            size: 7,
          },
        ],
      },
      labels: chartClaims.labels?.map((i: number) => new Date(i).toLocaleDateString()),
      xaxis: {
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        crosshairs: {
          show: true,
        },
        labels: {
          offsetX: isRtl ? 2 : 0,
          offsetY: 5,
          style: {
            fontSize: '12px',
            cssClass: 'apexcharts-xaxis-title',
          },
        },
      },
      yaxis: {
        tickAmount: 7,
        labels: {
          formatter: (value: number) => {
            return value.toLocaleString();
          },
          offsetX: isRtl ? -30 : -10,
          offsetY: 0,
          style: {
            fontSize: '12px',
            cssClass: 'apexcharts-yaxis-title',
          },
        },
        opposite: isRtl ? true : false,
      },
      grid: {
        borderColor: isDark ? '#191E3A' : '#E0E6ED',
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '16px',
        markers: {
          width: 10,
          height: 10,
          offsetX: -2,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5,
        },
      },
      tooltip: {
        marker: {
          show: true,
        },
        x: {
          show: false,
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          inverseColors: !1,
          opacityFrom: isDark ? 0.19 : 0.28,
          opacityTo: 0.05,
          stops: isDark ? [100, 100] : [45, 100],
        },
      },
    },
  };

  const [chartClaimInvites, setChartClaimInvites] = useState<{ [key: string]: any }>({});

  const [chartClaimInviteDay, setChartClaimInviteDay] = useState<number>(1);

  useEffect(() => {
    setChartClaimInvites({});

    axios.get('/api/charts/elem_invite_claimed', { params: { sort_type: chartClaimInviteDay } })
      .then(response => setChartClaimInvites(response.data))
      .catch(error => console.log(error));
  }, [chartClaimInviteDay]);

  const TotalELEMInviteClaimed: any = {
    series: [
      {
        name: 'total_amount',
        data: chartClaimInvites?.total_amount,
      },
      {
        name: 'amount',
        data: chartClaimInvites?.amount,
      },
    ],
    options: {
      chart: {
        height: 325,
        type: 'area',
        fontFamily: 'Nunito, sans-serif',
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },

      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        curve: 'smooth',
        width: 2,
        lineCap: 'square',
      },
      dropShadow: {
        enabled: true,
        opacity: 0.2,
        blur: 10,
        left: -7,
        top: 22,
      },
      colors: isDark ? ['#000', '#1B55E2'] : ['#000', '#1B55E2'],
      markers: {
        discrete: [
          {
            seriesIndex: 0,
            fillColor: '#000',
            strokeColor: 'transparent',
            size: 7,
          },
          {
            seriesIndex: 1,
            fillColor: '#1B55E2',
            strokeColor: 'transparent',
            size: 7,
          },
        ],
      },
      labels: chartClaimInvites.labels?.map((i: number) => new Date(i).toLocaleDateString()),
      xaxis: {
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        crosshairs: {
          show: true,
        },
        labels: {
          offsetX: isRtl ? 2 : 0,
          offsetY: 5,
          style: {
            fontSize: '12px',
            cssClass: 'apexcharts-xaxis-title',
          },
        },
      },
      yaxis: {
        tickAmount: 7,
        labels: {
          formatter: (value: number) => {
            return value.toLocaleString();
          },
          offsetX: isRtl ? -30 : -10,
          offsetY: 0,
          style: {
            fontSize: '12px',
            cssClass: 'apexcharts-yaxis-title',
          },
        },
        opposite: isRtl ? true : false,
      },
      grid: {
        borderColor: isDark ? '#191E3A' : '#E0E6ED',
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '16px',
        markers: {
          width: 10,
          height: 10,
          offsetX: -2,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5,
        },
      },
      tooltip: {
        marker: {
          show: true,
        },
        x: {
          show: false,
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          inverseColors: !1,
          opacityFrom: isDark ? 0.19 : 0.28,
          opacityTo: 0.05,
          stops: isDark ? [100, 100] : [45, 100],
        },
      },
    },
  };

  const [chartSpentELEMs, setChartSpentELEMs] = useState<{ [key: string]: any }>({});

  const [chartSpentELEMDay, setChartSpentELEMDay] = useState<number>(1);

  useEffect(() => {
    setChartSpentELEMs({});

    axios.get('/api/charts/spent_elem', { params: { sort_type: chartSpentELEMDay } })
      .then(response => setChartSpentELEMs(response.data))
      .catch(error => console.log(error));
  }, [chartSpentELEMDay]);

  const TotalELEMSpents: any = {
    series: [
      {
        name: 'total_amount',
        data: chartSpentELEMs?.total_amount,
      },
      {
        name: 'amount',
        data: chartSpentELEMs?.amount,
      },
    ],
    options: {
      chart: {
        height: 325,
        type: 'area',
        fontFamily: 'Nunito, sans-serif',
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },

      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        curve: 'smooth',
        width: 2,
        lineCap: 'square',
      },
      dropShadow: {
        enabled: true,
        opacity: 0.2,
        blur: 10,
        left: -7,
        top: 22,
      },
      colors: isDark ? ['#000', '#1B55E2'] : ['#000', '#1B55E2'],
      markers: {
        discrete: [
          {
            seriesIndex: 0,
            fillColor: '#000',
            strokeColor: 'transparent',
            size: 7,
          },
          {
            seriesIndex: 1,
            fillColor: '#1B55E2',
            strokeColor: 'transparent',
            size: 7,
          },
        ],
      },
      labels: chartSpentELEMs.labels?.map((i: number) => new Date(i).toLocaleDateString()),
      xaxis: {
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        crosshairs: {
          show: true,
        },
        labels: {
          offsetX: isRtl ? 2 : 0,
          offsetY: 5,
          style: {
            fontSize: '12px',
            cssClass: 'apexcharts-xaxis-title',
          },
        },
      },
      yaxis: {
        tickAmount: 7,
        labels: {
          formatter: (value: number) => {
            return value.toLocaleString();
          },
          offsetX: isRtl ? -30 : -10,
          offsetY: 0,
          style: {
            fontSize: '12px',
            cssClass: 'apexcharts-yaxis-title',
          },
        },
        opposite: isRtl ? true : false,
      },
      grid: {
        borderColor: isDark ? '#191E3A' : '#E0E6ED',
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '16px',
        markers: {
          width: 10,
          height: 10,
          offsetX: -2,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5,
        },
      },
      tooltip: {
        marker: {
          show: true,
        },
        x: {
          show: false,
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          inverseColors: !1,
          opacityFrom: isDark ? 0.19 : 0.28,
          opacityTo: 0.05,
          stops: isDark ? [100, 100] : [45, 100],
        },
      },
    },
  };

  return (
    <>
      {session && (session as any).user?.role === "subcriber" && (
        <div className="relative flex items-center rounded border border-danger bg-danger-light p-3.5 text-danger before:absolute before:top-1/2 before:-mt-2 before:inline-block before:border-b-8 before:border-r-8 before:border-t-8 before:border-b-transparent before:border-r-inherit before:border-t-transparent ltr:border-r-[64px] ltr:before:right-0 rtl:border-l-[64px] rtl:before:left-0 rtl:before:rotate-180 dark:bg-danger-dark-light">
          <span className="absolute inset-y-0 m-auto h-6 w-6 text-white ltr:-right-11 rtl:-left-11">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                opacity="0.5"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M12 7V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </span>
          <span className="ltr:pr-2 rtl:pl-2">
            <strong className="ltr:mr-1 rtl:ml-1">Warning!</strong>You don't have access to this
            page.
          </span>
          <button type="button" className="hover:opacity-80 ltr:ml-auto rtl:mr-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      {session && (session as any).user?.role !== "subcriber" && (
        <div className="mb-6 grid gap-6 xl:grid-cols-4">
          <div className="panel h-full xl:col-span-2">
            <div className="flex items-center justify-end dark:text-white-light">
              <div className="dropdown">
                <Dropdown
                  offset={[0, 1]}
                  placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                  button={
                    <svg className="h-5 w-5 text-black/70 hover:!text-primary dark:text-white/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle opacity="0.5" cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="19" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  }
                >
                  <ul>
                    <li>
                      <button type="button" onClick={() => setChartUserDay(1)}>1D</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setChartUserDay(3)}>3D</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setChartUserDay(7)}>7D</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setChartUserDay(14)}>14D</button>
                    </li>
                  </ul>
                </Dropdown>
              </div>
            </div>
            <p className="text-lg dark:text-white-light/90">
              Total Users: <span className="ml-2 text-primary">{typeof chartUsers.total_user_amount !== 'number' ? 'Loading...' : Number(chartUsers.total_user_amount).toLocaleString()}</span>
            </p>
            <div className="relative">
              <div className="rounded-lg bg-white dark:bg-black">
                {isMounted ? (
                  <ReactApexChart series={TotalUsers.series} options={TotalUsers.options} type="area" height={325} width={'100%'} />
                ) : (
                  <div className="grid min-h-[325px] place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                    <span className="inline-flex h-5 w-5 animate-spin rounded-full  border-2 border-black !border-l-transparent dark:border-white"></span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="panel h-full xl:col-span-2">
            <div className="flex items-center justify-end dark:text-white-light">
              <div className="dropdown">
                <Dropdown
                  offset={[0, 1]}
                  placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                  button={
                    <svg className="h-5 w-5 text-black/70 hover:!text-primary dark:text-white/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle opacity="0.5" cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="19" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  }
                >
                  <ul>
                    <li>
                      <button type="button" onClick={() => setChartClaimDay(1)}>1D</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setChartClaimDay(3)}>3D</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setChartClaimDay(7)}>7D</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setChartClaimDay(14)}>14D</button>
                    </li>
                  </ul>
                </Dropdown>
              </div>
            </div>
            <p className="text-lg dark:text-white-light/90">
              Total $ELEM Claimed: <span className="ml-2 text-primary">{typeof chartClaims.total_claim_amount !== 'number' ? 'Loading...' : Number(chartClaims.total_claim_amount).toLocaleString()}</span>
            </p>
            <div className="relative">
              <div className="rounded-lg bg-white dark:bg-black">
                {isMounted ? (
                  <ReactApexChart series={TotalELEMClaimed.series} options={TotalELEMClaimed.options} type="area" height={325} width={'100%'} />
                ) : (
                  <div className="grid min-h-[325px] place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                    <span className="inline-flex h-5 w-5 animate-spin rounded-full  border-2 border-black !border-l-transparent dark:border-white"></span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="panel h-full xl:col-span-2">
            <div className="flex items-center justify-end dark:text-white-light">
              <div className="dropdown">
                <Dropdown
                  offset={[0, 1]}
                  placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                  button={
                    <svg className="h-5 w-5 text-black/70 hover:!text-primary dark:text-white/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle opacity="0.5" cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="19" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  }
                >
                  <ul>
                    <li>
                      <button type="button" onClick={() => setChartClaimInviteDay(1)}>1D</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setChartClaimInviteDay(3)}>3D</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setChartClaimInviteDay(7)}>7D</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setChartClaimInviteDay(14)}>14D</button>
                    </li>
                  </ul>
                </Dropdown>
              </div>
            </div>
            <p className="text-lg dark:text-white-light/90">
              Total $ELEM Invite Claimed: <span className="ml-2 text-primary">{typeof chartClaimInvites.total_claim_amount !== 'number' ? 'Loading...' : Number(chartClaimInvites.total_claim_amount).toLocaleString()}</span>
            </p>
            <div className="relative">
              <div className="rounded-lg bg-white dark:bg-black">
                {isMounted ? (
                  <ReactApexChart series={TotalELEMInviteClaimed.series} options={TotalELEMInviteClaimed.options} type="area" height={325} width={'100%'} />
                ) : (
                  <div className="grid min-h-[325px] place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                    <span className="inline-flex h-5 w-5 animate-spin rounded-full  border-2 border-black !border-l-transparent dark:border-white"></span>
                  </div>
                )}
              </div>
            </div>
          </div>



          <div className="panel h-full xl:col-span-2">
            <div className="flex items-center justify-end dark:text-white-light">
              <div className="dropdown">
                <Dropdown
                  offset={[0, 1]}
                  placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                  button={
                    <svg className="h-5 w-5 text-black/70 hover:!text-primary dark:text-white/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle opacity="0.5" cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="19" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  }
                >
                  <ul>
                    <li>
                      <button type="button" onClick={() => setChartSpentELEMDay(1)}>1D</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setChartSpentELEMDay(3)}>3D</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setChartSpentELEMDay(7)}>7D</button>
                    </li>
                    <li>
                      <button type="button" onClick={() => setChartSpentELEMDay(14)}>14D</button>
                    </li>
                  </ul>
                </Dropdown>
              </div>
            </div>
            <p className="text-lg dark:text-white-light/90">
              Total $ELEM Spents: <span className="ml-2 text-primary">{typeof chartSpentELEMs.total_spent !== 'number' ? 'Loading...' : Number(chartSpentELEMs.total_spent).toLocaleString()}</span>
            </p>
            <div className="relative">
              <div className="rounded-lg bg-white dark:bg-black">
                {isMounted ? (
                  <ReactApexChart series={TotalELEMSpents.series} options={TotalELEMSpents.options} type="area" height={325} width={'100%'} />
                ) : (
                  <div className="grid min-h-[325px] place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                    <span className="inline-flex h-5 w-5 animate-spin rounded-full  border-2 border-black !border-l-transparent dark:border-white"></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Index;
