const load = require('./load');
const OR = load(['js/core/ns.js','js/core/rng.js','js/core/frac.js','js/core/lp.js','js/core/bnb.js']);
const show = tr => tr.nodes.map(n => `#${n.id} t=${n.t} ${n.branch?OR.bnb.branchText(n.branch):'root'} | ${n.lp? (n.lp.status==='optimal'? 'z='+n.lp.z+' x=['+n.lp.x.join(', ')+']':'INF') : '-'} | ${n.status}${n.best?' ★':''}`).join('\n');
let fails = 0; const eq=(a,b,m)=>{ if(String(a)!==String(b)){ fails++; console.log('FAIL',m,'got',String(a),'want',String(b)); } };

// Example 5 Pure IP: max 8x1+5x2; x1+x2<=6; 9x1+5x2<=45 -> z=40 (5,0); LR 165/4
let P = { c:[8,5], A:[[1,1],[9,5]], b:[6,45], intVars:[0,1] };
let tr = OR.bnb.run(P, {order:'lifo', firstChild:'up'});
console.log('--- Pure IP (LIFO, up first)\n'+show(tr));
eq(tr.nodes[0].lp.z, '165/4', 'LR z'); eq(tr.best.z, 40, 'pure best');
eq(tr.nodes[1].lp.z, 41, 'subp2'); eq(tr.nodes[1].lp.x[1], '9/5','subp2 x2');
eq(tr.nodes[2].lp.z, 39, 'subp3'); eq(tr.nodes[4].lp.z, '365/9', 'subp5'); eq(tr.nodes[3].lp.status, 'infeasible', 'subp4');

// Example 6 Mixed: max 2x1+x2; 5x1+2x2<=8; x1+x2<=3; x1 int -> 7/2
P = { c:[2,1], A:[[5,2],[1,1]], b:[8,3], intVars:[0] };
tr = OR.bnb.run(P, {order:'lifo', firstChild:'up'});
console.log('--- Mixed\n'+show(tr)); eq(tr.best.z,'7/2','mixed');

// Example 7 Binary (jumptracking)
P = { c:['0.2','0.3','0.5','0.1'], A:[['0.5',1,'1.5','0.1'],['0.3','0.8','1.5','0.4'],['0.2','0.2','0.3','0.1']], b:['3.1','2.5','0.4'], lo:[0,0,0,0], hi:[1,1,1,1], intVars:[0,1,2,3] };
tr = OR.bnb.run(P, {order:'jump'});
console.log('--- Binary (jump)\n'+show(tr)); eq(tr.best.z,'3/5','binary');
// Notes' P1 (x2=0) has alternative LP optima (x1=0.5 or x4=1, both z=0.6) -> engine must flag it
eq(tr.ambiguous, true, 'binary ambiguity flagged');

// Example 8 Knapsack (jump + floor rule)
P = { c:[8,11,6,4], A:[[5,7,4,3]], b:[14], lo:[0,0,0,0], hi:[1,1,1,1], intVars:[0,1,2,3] };
tr = OR.bnb.run(P, {order:'jump', floorRule:true});
console.log('--- Knapsack (jump, floor)\n'+show(tr)); eq(tr.best.z,21,'knap');
console.log('events:', tr.events.map(e=>e.type+':'+e.id).join(' '));
eq(tr.nodes[1].lp.z, '65/3', 'knap P1'); eq(tr.nodes[2].lp.z, '153/7', 'knap P2'); eq(tr.nodes[4].lp.z, '109/5', 'knap P4'); eq(tr.nodes[1].status, 'bound', 'knap P1 fathomed by floor rule');
console.log(fails ? fails+' FAILURES' : 'ALL OK');
