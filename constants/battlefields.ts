export interface BattlefieldDef {
  key: string;
  name: string;
  desc: string;
  iconType: 'porn' | 'lust' | 'fantasy' | 'greed' | 'pride';
}

export const BATTLEFIELD_DEFS: BattlefieldDef[] = [
  { key: 'porn',    name: 'Pornography',    desc: 'Visual sexual content',          iconType: 'porn'    },
  { key: 'lust',    name: 'Lust of Eyes',   desc: 'Dwelling on lustful glances',    iconType: 'lust'    },
  { key: 'fantasy', name: 'Sexual Fantasy', desc: 'Entertaining sexual thought',    iconType: 'fantasy' },
  { key: 'greed',   name: 'Greed',          desc: 'Materialism and coveting',       iconType: 'greed'   },
  { key: 'pride',   name: 'Pride',          desc: 'Arrogance of spirit',            iconType: 'pride'   },
];
