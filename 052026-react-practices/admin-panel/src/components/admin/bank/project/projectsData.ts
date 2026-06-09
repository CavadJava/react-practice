export interface Project {
  id: number;
  name: string;
  uniqueId: string;
  status: 'UP' | 'DOWN';
  pid: string;
  path: string;
  swaggerUrl: string;
  // Ətraflı səhifəsi üçün əlavə məlumatlar:
  description: string;
  version: string;
  memoryUsage: string;
  cpuUsage: string;
  lastDeployment: string;
}

export const projectsData: Project[] = [
  {
    id: 1,
    uniqueId: "AA01",
    name: 'Online Deposit Service',
    status: 'UP',
    pid: '14208',
    path: '/var/www/online-deposit',
    swaggerUrl: 'http://localhost:4000/swagger-ui/index.html',
    description: 'Müştərilərin onlayn şəkildə depozit açması və idarə etməsi üçün əsas mikroxidmət.',
    version: 'v2.4.1',
    memoryUsage: '256 MB',
    cpuUsage: '1.2%',
    lastDeployment: '08.06.2026 14:30'
  },
  {
    id: 2,
    uniqueId: "AA02",
    name: 'Openbanking Service',
    status: 'UP',
    pid: '14209',
    path: '/var/www/openbanking',
    swaggerUrl: 'http://localhost:3000/swagger-ui/index.html',
    description: 'Üçüncü tərəf tətbiqlərin bank sisteminə təhlükəsiz inteqrasiyası üçün API xidməti.',
    version: 'v1.1.0',
    memoryUsage: '512 MB',
    cpuUsage: '4.8%',
    lastDeployment: '07.06.2026 11:15'
  }
];

export interface ServicesData {
  id: number;
  name: string;
  directoryPath: string;
  apiEndpoint: {
    method: string;
    url: string;
    description: string;
  }[];
}

export const serviceData: ServicesData[] = [
  {
    id: 1,
    name: "Online Deposit Service",
    directoryPath: "/home/sanan/online-deposit-back-service",
    apiEndpoint: [
      {
        method: "GET",
        url: "/api/v1/deposits",
        description: "Bütün depozit əməliyyatlarını əldə etmək üçün endpoint."
      }
    ]
  },
];