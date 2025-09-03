const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function run(cmd, args, opts = {}){
  return new Promise((resolve, reject)=>{
    const p = spawn(cmd, args, Object.assign({stdio: 'inherit', shell: false}, opts));
    p.on('close', code => code===0 ? resolve(code) : reject(new Error(`${cmd} exited ${code}`)));
  });
}

(async function(){
  try{
    console.log('Starting docker-compose for dev...');
    await run('docker-compose', ['-f','docker-compose.dev.yml','up','-d']);

    console.log('Waiting for Postgres to become healthy...');
    // poll pg_isready inside container
    const max = 40;
    for(let i=0;i<max;i++){
      try{
        // find postgres container id
        const id = require('child_process').execSync('docker ps -qf "ancestor=postgres:15"').toString().trim();
        if(!id){ console.log('Postgres container not found yet...'); throw new Error('no container'); }
        const out = require('child_process').execSync(`docker exec ${id} pg_isready -U nexus`).toString();
        if(out.includes('accepting connections')){ console.log('Postgres is ready'); break; }
      }catch(e){ console.log('waiting...'); }
      await new Promise(r=>setTimeout(r,1500));
    }

    console.log('Running connector DB init script...');
    await run(process.execPath, [path.join(__dirname,'..','services','quickbooks-connector','scripts','init_db.mjs')]);

    console.log('Tailing docker-compose logs (ctrl-c to stop)');
    await run('docker-compose', ['-f','docker-compose.dev.yml','logs','-f']);
  }catch(e){
    console.error('Bootstrap failed:', e.message);
    process.exit(1);
  }
})();
