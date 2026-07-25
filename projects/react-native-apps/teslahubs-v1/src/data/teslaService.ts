export type TeslaServiceItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const TESLA_SERVICES: TeslaServiceItem[] = [
  {
    id: 'battery16v',
    name: '16V Akkumulyator Bərpası',
    description: 'Aşağı gərginlikli akkumulyatorun diaqnostikası, bərpası və dəyişdirilməsi',
    icon: '🔋',
  },
  {
    id: 'airbag',
    name: 'Airbag Sistemlərinin Bərpası',
    description: 'Airbag idarəetmə blokunun (SRS) xəta kodlarının aradan qaldırılması və tam bərpası',
    icon: '🛡️',
  },
  {
    id: 'digital',
    name: 'Rəqəmsal Xidmətlərin Bərpası',
    description: 'Mərkəzi ekran (MCU), proqram təminatı və rəqəmsal modulların bərpası',
    icon: '💻',
  },
];

export function getTeslaService(id: string): TeslaServiceItem | undefined {
  return TESLA_SERVICES.find(s => s.id === id);
}
