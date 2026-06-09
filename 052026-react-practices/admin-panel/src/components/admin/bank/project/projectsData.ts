// 1. Hər mühit üçün dəyişəcək dinamik sahələrin strukturu
interface EnvironmentConfig {
  serviceName: string;
  swaggerUrl: string;
  directoryPath: string;
}

// 2. Layihənin ortaq (Common) sahələrini ehtiva edən əsas interfeys
export interface Project {
  id: number;
  uniqueId: string;
  name: string;
  description: string;

  environments: {
    dev: EnvironmentConfig;
    prod: EnvironmentConfig;
  };
}

// 3. Yenilənmiş ortaq məlumat massivi
export const projectsData: Project[] = [
  {
    id: 1,
    uniqueId: "AA01",
    name: "IPS",
    description:
      "Müştərilərin onlayn şəkildə depozit açması və idarə etməsi üçün əsas mikroxidmət.",
    environments: {
      dev: {
        serviceName: "ms-ips",
        swaggerUrl: "http://localhost:4000/swagger-ui/index.html",
        directoryPath: "/home/dev/ms-ips/logs",
      },
      prod: {
        serviceName: "ips",
        swaggerUrl: "http://localhost:4000/swagger-ui/index.html",
        directoryPath: "/var/www/online-deposit",
      },
    },
  },

  {
    id: 2,
    uniqueId: "AA02",
    name: "Notification Admin Service",
    description:
      "Üçüncü tərəf tətbiqlərin bank sisteminə təhlükəsiz inteqrasiyası üçün API xidməti.",
    environments: {
      dev: {
        serviceName: "notification-admin",
        swaggerUrl: "http://localhost:3000/swagger-ui/index.html",
        directoryPath: "/home/dev/notification-admin/logs",
      },
      prod: {
        serviceName: "notification-admin",
        swaggerUrl: "http://localhost:3000/swagger-ui/index.html",
        directoryPath: "/var/www/openbanking",
      },
    },
  },

  {
    id: 3,
    uniqueId: "AA03",
    name: "Api Gateway Service",
    description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
    environments: {
      dev: {
        serviceName: "api-gateway",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/home/dev/api-gateway/logs",
      },
      prod: {
        serviceName: "api-gateway",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/var/www/customer-management",
      },
    },
  },

  {
    id: 5,
    uniqueId: "AA05",
    name: "AP Azericard Service",
    description: "Kart əməliyyatları və Azericard inteqrasiyası xidməti.",
    environments: {
      dev: {
        serviceName: "ap-azericard-ms",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/home/dev/ap-azericard/logs",
      },
      prod: {
        serviceName: "ap-azericard-ms",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/var/www/customer-management",
      },
    },
  },

  {
    id: 6,
    uniqueId: "AA06",
    name: "Contact Data Service",
    description: "Müştəri əlaqə məlumatlarının idarə olunması xidməti.",
    environments: {
      dev: {
        serviceName: "contact-data",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/home/dev/contact-data/logs",
      },
      prod: {
        serviceName: "contact-data",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/var/www/customer-management",
      },
    },
  },

  {
    id: 7,
    uniqueId: "AA07",
    name: "MB Card Service",
    description: "Kart məlumatlarının idarə olunması xidməti.",
    environments: {
      dev: {
        serviceName: "mb-card-ms",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/home/dev/mb-card/logs",
      },
      prod: {
        serviceName: "mb-card-ms",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/var/www/customer-management",
      },
    },
  },

  {
    id: 8,
    uniqueId: "AA08",
    name: "MS VAT Refund Service",
    description: "ƏDV qaytarılması əməliyyatlarının idarə olunması xidməti.",
    environments: {
      dev: {
        serviceName: "ms-vat-refund",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/home/dev/vat-refund/logs",
      },
      prod: {
        serviceName: "ms-vat-refund-ms",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/var/www/customer-management",
      },
    },
  },

  {
    id: 9,
    uniqueId: "AA09",
    name: "MS PARTNER Service",
    description: "Partnyor sistemləri ilə inteqrasiya xidməti.",
    environments: {
      dev: {
        serviceName: "partner-ms",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/home/dev/partner-ms/logs",
      },
      prod: {
        serviceName: "partner-ms",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/var/www/customer-management",
      },
    },
  },

  {
    id: 10,
    uniqueId: "AA10",
    name: "Eureka Server",
    description: "Servis qeydiyyatı və discovery xidməti.",
    environments: {
      dev: {
        serviceName: "eureka-server",
        swaggerUrl: "",
        directoryPath: "/home/dev/eureka/logs",
      },
      prod: {
        serviceName: "eureka-server",
        swaggerUrl: "",
        directoryPath: "/var/www/customer-management",
      },
    },
  },

  {
    id: 11,
    uniqueId: "AA11",
    name: "Limit Service",
    description: "Limitlərin idarə olunması xidməti.",
    environments: {
      dev: {
        serviceName: "limit-ms",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/home/dev/limit-ms/logs",
      },
      prod: {
        serviceName: "limit-ms",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/var/www/customer-management",
      },
    },
  },

  {
    id: 12,
    uniqueId: "AA12",
    name: "Credit Service",
    description: "Kredit əməliyyatlarının idarə olunması xidməti.",
    environments: {
      dev: {
        serviceName: "mb-credit-ms",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/home/dev/credit-ms/logs",
      },
      prod: {
        serviceName: "mb-credit-ms",
        swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
        directoryPath: "/var/www/customer-management",
      },
    },
  },
  {
  id: 13,
  uniqueId: "AA13",
  name: "Ms Nfc Payment Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "ms-nfc-payment",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "ms-nfc-payment",
      swaggerUrl: "https://api.example.com/ms-nfc-payment/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 14,
  uniqueId: "AA14",
  name: "Pin Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "pin-ms",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "pin-ms",
      swaggerUrl: "https://api.example.com/pin-ms/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 15,
  uniqueId: "AA15",
  name: "Card Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "card-ms",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "card-ms",
      swaggerUrl: "https://api.example.com/card-ms/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 16,
  uniqueId: "AA16",
  name: "FastPay Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "fastpay-ms",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "fastpay-ms",
      swaggerUrl: "https://api.example.com/fastpay-ms/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 17,
  uniqueId: "AA17",
  name: "Deposit Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "mb-deposit-ms",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "mb-deposit-ms",
      swaggerUrl: "https://api.example.com/mb-deposit-ms/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 18,
  uniqueId: "AA18",
  name: "Notification Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "notification",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "notification",
      swaggerUrl: "https://api.example.com/notification/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 19,
  uniqueId: "AA19",
  name: "Card Order Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "card-order",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "card-order",
      swaggerUrl: "https://api.example.com/card-order/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 20,
  uniqueId: "AA20",
  name: "Friend Payment Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "friend-payment-ms",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "friend-payment-ms",
      swaggerUrl: "https://api.example.com/friend-payment-ms/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 21,
  uniqueId: "AA21",
  name: "Lottery Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "lottery-ms",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "lottery-ms",
      swaggerUrl: "https://api.example.com/lottery-ms/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 22,
  uniqueId: "AA22",
  name: "Pin Change Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "ms-pin-change",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "ms-pin-change",
      swaggerUrl: "https://api.example.com/ms-pin-change/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 23,
  uniqueId: "AA23",
  name: "Card Storage Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "card-storage",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "card-storage",
      swaggerUrl: "https://api.example.com/card-storage/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 24,
  uniqueId: "AA24",
  name: "Gpp Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "gpp",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "gpp",
      swaggerUrl: "https://api.example.com/gpp/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 25,
  uniqueId: "AA25",
  name: "Account Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "mb-account-ms",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "mb-account-ms",
      swaggerUrl: "https://api.example.com/mb-account-ms/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 26,
  uniqueId: "AA26",
  name: "Card History Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "ms-card-history",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "ms-card-history",
      swaggerUrl: "https://api.example.com/ms-card-history/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
},
{
  id: 27,
  uniqueId: "AA27",
  name: "User Info Service",
  description: "Müştərilərin idarə edilməsi üçün əsas mikroxidmət.",
  environments: {
    dev: {
      serviceName: "ms-user-info",
      swaggerUrl: "http://localhost:5000/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    },
    prod: {
      serviceName: "ms-user-info",
      swaggerUrl: "https://api.example.com/ms-user-info/swagger-ui/index.html",
      directoryPath: "/var/www/customer-management"
    }
  }
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

export interface LeftMenu {
  id: number;
  name: string;
  icon: string;
  link: string;
}



// --- 1. ENUMLARIN TƏYİN EDİLMƏSİ (Yeni əlavə) ---
export enum ApplicationStatus {
  SYSTEM_CANCEL = 'SYSTEM_CANCEL',
  CANCEL = 'CANCEL'
}

export enum ApplicationType {
  KLASSIK = 'Klassik',
  EXTRA = 'Extra'
}

// --- 1. TİP TƏYİNLƏRİ (INTERFACES) ---
export interface Customer {
  customerId: string;
  pin: string;
  docNumber: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  address?: string;
  email?: string;
}

export interface CustomersResponse {
  result: Customer[];
  code: number;
  message: string;
}

export interface Integration {
  id: number;
  customerId: string;
  systemName: string;
  status: 'ACTIVE' | 'FAILED';
  endpoint: string;
}

// Yeni göndərdiyin Java ApplicationResponse modelinə uyğun interfeys
export interface Application {
  customerId: number;
  applicationId: number;
  applicationNumber: string;
  status: ApplicationStatus;
  type: ApplicationType;
}

export interface ApplicationsResponse {
  result: Application[];
  code: number;
  message: string;
}