# JS GBC

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).


The core emulator mechanics were adapted from this project: [GameBoy-Online](https://github.com/taisel/GameBoy-Online/tree/47f9f638a8a9445aaa75050f634e437baa34aae0). This guy did most of the legwork and I learned a lot about Javascript and even computer science from deconstructing his work.

The TODO list can be found [here](https://github.com/gcox32/gameboy/blob/main/TODO.md).

![cloyster](https://assets.letmedemo.com/public/gameboy/images/pokemon/sugimori/rb/091.png)

## S3 Structure

&lt;s3endpoint&gt;/private/&lt;user-pool-region&gt;:&lt;user-cognito-sub&gt;/  
  ├─ games/  
  │&nbsp;&nbsp;&nbsp;&nbsp;├── &lt;game-id&gt;/  
  │&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── gameFile.ext  
  │&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── gameImg.png  
  │&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── saveStates/  
  │&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── &lt;save-state-id&gt;/  
  │&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── file1.sav  
  │&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── file2.json  
  │&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── file3.png  
  │&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── ...  
  │&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── ...  
  │&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── ...    
  │&nbsp;&nbsp;&nbsp;&nbsp;└── ...  
  └─ profile/  
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ avatar.png  
      └─ ...  

&lt;s3endpoint&gt;/public/  
  &nbsp;&nbsp;&nbsp;&nbsp;├─ asset1.png  
  &nbsp;&nbsp;&nbsp;&nbsp;├─ asset2.js  
  &nbsp;&nbsp;&nbsp;&nbsp;└─ ...  


