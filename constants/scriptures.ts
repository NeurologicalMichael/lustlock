export interface Scripture {
  verse: string;
  reference: string;
}

export const SCRIPTURES: Scripture[] = [
  {
    verse:
      'Flee from sexual immorality. Every other sin a person commits is outside the body, but the sexually immoral person sins against his own body. Or do you not know that your body is a temple of the Holy Spirit within you, whom you have from God?',
    reference: '1 Corinthians 6:18-20',
  },
  {
    verse:
      'I have made a covenant with my eyes; how then could I gaze at a virgin?',
    reference: 'Job 31:1',
  },
  {
    verse:
      'How can a young man keep his way pure? By guarding it according to your word. I have stored up your word in my heart, that I might not sin against you.',
    reference: 'Psalm 119:9-11',
  },
  {
    verse:
      'But I say to you that everyone who looks at a woman with lustful intent has already committed adultery with her in his heart.',
    reference: 'Matthew 5:28',
  },
  {
    verse:
      'But put on the Lord Jesus Christ, and make no provision for the flesh, to gratify its desires.',
    reference: 'Romans 13:14',
  },
  {
    verse:
      'But I say, walk by the Spirit, and you will not gratify the desires of the flesh.',
    reference: 'Galatians 5:16',
  },
  {
    verse:
      'For this is the will of God, your sanctification: that you abstain from sexual immorality; that each one of you know how to control his own body in holiness and honor, not in the passion of lust.',
    reference: '1 Thessalonians 4:3-5',
  },
  {
    verse:
      'So flee youthful passions and pursue righteousness, faith, love, and peace, along with those who call on the Lord from a pure heart.',
    reference: '2 Timothy 2:22',
  },
  {
    verse:
      'But each person is tempted when he is lured and enticed by his own desire. Then desire when it has conceived gives birth to sin, and sin when it is fully grown brings forth death.',
    reference: 'James 1:14-15',
  },
  {
    verse:
      'Beloved, I urge you as sojourners and exiles to abstain from the passions of the flesh, which wage war against your soul.',
    reference: '1 Peter 2:11',
  },
  {
    verse:
      'Keep your heart with all vigilance, for from it flow the springs of life.',
    reference: 'Proverbs 4:23',
  },
  {
    verse:
      'For if you live according to the flesh you will die, but if by the Spirit you put to death the deeds of the body, you will live.',
    reference: 'Romans 8:13',
  },
  {
    verse:
      'For we do not have a high priest who is unable to sympathize with our weaknesses, but one who in every respect has been tempted as we are, yet without sin. Let us then with confidence draw near to the throne of grace, that we may receive mercy and find grace to help in time of need.',
    reference: 'Hebrews 4:15-16',
  },
  {
    verse:
      'Finally, brothers, whatever is true, whatever is honorable, whatever is just, whatever is pure, whatever is lovely, whatever is commendable, if there is any excellence, if there is anything worthy of praise, think about these things.',
    reference: 'Philippians 4:8',
  },
  {
    verse:
      'But sexual immorality and all impurity or covetousness must not even be named among you, as is proper among saints.',
    reference: 'Ephesians 5:3',
  },
  {
    verse:
      'Put to death therefore what is earthly in you: sexual immorality, impurity, passion, evil desire, and covetousness, which is idolatry.',
    reference: 'Colossians 3:5',
  },
  {
    verse:
      'For all that is in the world—the desires of the flesh and the desires of the eyes and pride of life—is not from the Father but is from the world.',
    reference: '1 John 2:16',
  },
  {
    verse:
      'Create in me a clean heart, O God, and renew a right spirit within me.',
    reference: 'Psalm 51:10',
  },
  {
    verse:
      'Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.',
    reference: 'Isaiah 41:10',
  },
  {
    verse:
      'Let not sin therefore reign in your mortal body, to make you obey its passions. Do not present your members to sin as instruments for unrighteousness, but present yourselves to God.',
    reference: 'Romans 6:12-13',
  },
  {
    verse:
      'No temptation has overtaken you that is not common to man. God is faithful, and he will not let you be tempted beyond your ability, but with the temptation he will also provide the way of escape.',
    reference: '1 Corinthians 10:13',
  },
  {
    verse:
      'For the one who sows to his own flesh will from the flesh reap corruption, but the one who sows to the Spirit will from the Spirit reap eternal life.',
    reference: 'Galatians 6:8',
  },
  {
    verse:
      'I appeal to you therefore, brothers, by the mercies of God, to present your bodies as a living sacrifice, holy and acceptable to God, which is your spiritual worship. Do not be conformed to this world, but be transformed by the renewal of your mind.',
    reference: 'Romans 12:1-2',
  },
  {
    verse:
      'Search me, O God, and know my heart! Try me and know my thoughts! And see if there be any grievous way in me, and lead me in the way everlasting!',
    reference: 'Psalm 139:23-24',
  },
  {
    verse:
      'Therefore, since we are surrounded by so great a cloud of witnesses, let us also lay aside every weight, and sin which clings so closely, and let us run with endurance the race that is set before us.',
    reference: 'Hebrews 12:1',
  },
  {
    verse:
      'Submit yourselves therefore to God. Resist the devil, and he will flee from you.',
    reference: 'James 4:7',
  },
  {
    verse:
      'Be sober-minded; be watchful. Your adversary the devil prowls around like a roaring lion, seeking someone to devour. Resist him, firm in your faith.',
    reference: '1 Peter 5:8-9',
  },
  {
    verse:
      'Do not desire her beauty in your heart, and do not let her capture you with her eyelashes.',
    reference: 'Proverbs 6:25',
  },
  {
    verse:
      'Watch and pray that you may not enter into temptation. The spirit indeed is willing, but the flesh is weak.',
    reference: 'Matthew 26:41',
  },
  {
    verse:
      'The one who conquers will have this heritage, and I will be his God and he will be my son.',
    reference: 'Revelation 21:7',
  },
];

export function getRandomScripture(): Scripture {
  return SCRIPTURES[Math.floor(Math.random() * SCRIPTURES.length)];
}
