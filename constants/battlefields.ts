export interface BattlefieldDef {
  key: string;
  name: string;
  desc: string;
  iconType: 'porn' | 'lust' | 'fantasy' | 'greed' | 'pride';
}

export const BATTLEFIELD_DEFS: BattlefieldDef[] = [
  { key: 'lust',    name: 'Lust',           desc: 'Pornography, lustful looks, and fantasy', iconType: 'lust' },
  { key: 'greed',   name: 'Greed',          desc: 'Materialism and coveting',       iconType: 'greed'   },
  { key: 'pride',   name: 'Pride',          desc: 'Arrogance of spirit',            iconType: 'pride'   },
];
