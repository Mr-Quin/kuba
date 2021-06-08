(this.webpackJsonpKuba=this.webpackJsonpKuba||[]).push([[0],{106:function(e,n,t){"use strict";t.r(n);var r,a,c,o,i,u,s,l,b,d,f=t(0),O=t.n(f),j=t(23),h=t.n(j),v=(t(90),t(7)),p=t(129),g=t(143),m=t(131),w=t(15),E=t(4),x=t(6),T=t(50),y=function(e){return e[e.length-1]},N=function(e,n){return e+n},M=function(e){window.location.hash=null!==e&&void 0!==e?e:""},R=function(e,n){return Array.from({length:Math.ceil(e.length/n)},(function(t,r){return e.slice(r*n,r*n+n)}))},P=function(e){var n=e.toLowerCase();return n.charAt(0).toUpperCase()+n.slice(1)};!function(e){e[e.EMPTY=-1]="EMPTY",e[e.WHITE=0]="WHITE",e[e.BLACK=1]="BLACK",e[e.RED=2]="RED"}(s||(s={})),function(e){e.LEFT="l",e.RIGHT="r",e.UP="u",e.DOWN="d"}(l||(l={})),function(e){e[e.NONE=-1]="NONE",e[e.GAME_OVER=0]="GAME_OVER",e[e.WRONG_TURN=1]="WRONG_TURN",e[e.WRONG_DIRECTION=2]="WRONG_DIRECTION",e[e.OWN_MARBLE=3]="OWN_MARBLE",e[e.NO_UNDO=4]="NO_UNDO"}(b||(b={})),function(e){e[e.OFF_GRID=-1]="OFF_GRID"}(d||(d={}));var k,C=(r={},Object(x.a)(r,b.GAME_OVER,"Game is already over"),Object(x.a)(r,b.WRONG_TURN,"Opponent's turn"),Object(x.a)(r,b.WRONG_DIRECTION,"Invalid direction"),Object(x.a)(r,b.OWN_MARBLE,"Cannot push off own marble"),Object(x.a)(r,b.NO_UNDO,"Cannot undo opponent's move"),r),I=(a={},Object(x.a)(a,s.WHITE,"w"),Object(x.a)(a,s.BLACK,"b"),Object(x.a)(a,s.RED,"r"),Object(x.a)(a,s.EMPTY,""),a),W={w:s.WHITE,b:s.BLACK,r:s.RED},S=(c={},Object(x.a)(c,l.LEFT,-1),Object(x.a)(c,l.RIGHT,1),Object(x.a)(c,l.UP,-7),Object(x.a)(c,l.DOWN,7),c),A=(o={},Object(x.a)(o,l.LEFT,new Set([0,7,14,21,28,35,42])),Object(x.a)(o,l.RIGHT,new Set([6,13,20,27,34,41,48])),Object(x.a)(o,l.UP,new Set([0,1,2,3,4,5,6])),Object(x.a)(o,l.DOWN,new Set([42,43,44,45,46,47,48])),o),D=(i={},Object(x.a)(i,s.WHITE,s.BLACK),Object(x.a)(i,s.BLACK,s.WHITE),i),G=(u={},Object(x.a)(u,l.UP,l.DOWN),Object(x.a)(u,l.DOWN,l.UP),Object(x.a)(u,l.LEFT,l.RIGHT),Object(x.a)(u,l.RIGHT,l.LEFT),u),_=function(e){return D[e]},L=function(e){var n=Object(v.a)(e,2),t=n[0],r=n[1];return A[r].has(t)},H=function(e){var n=Object(v.a)(e,2),t=n[0],r=n[1];return N(S[r],t)},U=function e(n,t){var r=Object(v.a)(n,2),a=r[0],c=r[1],o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[],i=t(a);return i===s.EMPTY?o:L([a,c])?[a].concat(Object(w.a)(o)):e([H([a,c]),c],t,[a].concat(Object(w.a)(o)))},B=function(){var e=[s.EMPTY,s.BLACK,s.WHITE,s.RED],n=e[0],t=e[1],r=e[2],a=e[3];return[r,r,n,n,n,t,t,r,r,n,a,n,t,t,n,n,a,a,a,n,n,n,a,a,a,a,a,n,n,n,a,a,a,n,n,t,t,n,a,n,r,r,t,t,n,n,n,r,r]},F=function(e,n){return Object.values(e).filter((function(e){return e.color===n})).reduce((function(e,n){var t=n.moves;return e+Object.values(t).reduce((function(e,n){return n===b.NONE?e+1:e}),0)}),0)},z=function(e){return e.reduce((function(e,n){return n===s.EMPTY?e:Object(E.a)(Object(E.a)({},e),{},Object(x.a)({},n,void 0===e[n]?1:e[n]+1))}),{})},Y=function(e){return e===s.EMPTY},K=function(e){return e.reduce((function(e,n,t){return Y(n)?e:[].concat(Object(w.a)(e),[{pos:t,color:n,id:t}])}),[])},V=function(e){return(n=e,R(n,7)).reduce((function(e,n){var t=0,r=n.reduce((function(e,n){if(n===s.EMPTY)return t+=1,e;if(t>0){var r=e+t.toString()+I[n];return t=0,r}return e+I[n]}),e);return t>0?r+t.toString()+"/":r+"/"}),"").slice(0,-1);var n},J=function(e){return Object.entries(e).map((function(e){var n=Object(v.a)(e,2),t=n[0],r=n[1];return I[parseInt(t)]+r.toString()})).join("")},q=function(e){return new Promise((function(n,t){var r=[];e.split("/").forEach((function(e){e.split("").forEach((function(e){if(Number.isInteger(parseInt(e))){var n=new Array(parseInt(e)).fill(s.EMPTY);r.push.apply(r,Object(w.a)(n))}else r.push(W[e])}))})),49!==r.length&&t("Board: Incorrect notation"),n(r)}))},Q=function(e){return new Promise((function(n,t){4!==e.length&&t("Capture: Incorrect notation"),n(Object.fromEntries(R(e.split(""),2).map((function(e){return[W[e[0]],parseInt(e[1])]}))))}))},$={allowExtraTurns:!0,board:[],boardHistory:[],captures:(k={},Object(x.a)(k,s.BLACK,0),Object(x.a)(k,s.WHITE,0),k),currentPlayer:null,errorMessage:{message:"",update:0},hash:0,hashTable:Array(49).fill(0).map((function(){var e=new Uint32Array(3);return window.crypto.getRandomValues(e),e})),moveTable:null,pieces:[],turn:1,winner:null},X=Object(T.a)((function(e,n){return Object(E.a)(Object(E.a)({},$),{},{makeMove:function(t){var r=n(),a=r.getMarble,c=r.tryMove,o=r.preCheckMove,i=r.setError,u=r.updateRoute,s=r.updateState,l=r.propagateMove,b=Object(v.a)(t,2),d=b[0],f=b[1],O=a(d);o(t).then((function(){return U(t,a)})).then(c(t)).then(l(f)).then(e).then(s(O)).then(e).then(u).catch(i)},tryMove:function(e){var t=Object(v.a)(e,2),r=t[0],a=t[1];return function(e){var t,c,o=n(),i=o.getMarble,u=o.moveTable,s=o.checkMove,l=null===o.currentPlayer||null===u?s([r,a],e,i(r)):null!==(t=null===(c=u[r])||void 0===c?void 0:c.moves[a])&&void 0!==t?t:b.WRONG_TURN;return l!==b.NONE?Promise.reject(C[l]):Promise.resolve(e)}},propagateMove:function(e){return function(t){var r=n(),a=r.hashMove,c=r.board,o=r.pieces;(0,r.pushHistory)();var i=y(t),u=a(e)(t),l=Object(w.a)(c),b=Object(w.a)(o);return t.forEach((function(n){var t,r=L([n,e]),a=null!==(t=l[n])&&void 0!==t?t:s.EMPTY,c=N(n,S[e]),o=b.findIndex((function(e){return e.pos===n}));r?b[o]=Object(E.a)(Object(E.a)({},b[o]),{},{pos:d.OFF_GRID}):(b[o]=Object(E.a)(Object(E.a)({},b[o]),{},{pos:c}),l[c]=a)})),l[i]=s.EMPTY,Promise.resolve({hash:u,board:l,pieces:b})}},hashMove:function(e){return function(t){var r=n(),a=r.hashTable,c=r.getMarble,o=r.hash;return t.reduce((function(n,t,r){var o=c(t),i=H([t,e]);return 0===r&&L([t,e])?n^a[t][o]:n^a[t][o]^a[i][o]}),o)}},getMarble:function(e){var t;return null!==(t=n().board[e])&&void 0!==t?t:s.EMPTY},searchMoves:function(){var e=n(),t=e.pieces,r=e.checkMove,a=e.getMarble,c=Object.values(l);return t.filter((function(e){return e.color!==s.RED&&e.pos!==d.OFF_GRID})).reduce((function(e,n){var t=n.pos,o=n.color,i=c.reduce((function(e,n){var c=U([t,n],a),o=[t,n];return Object(E.a)(Object(E.a)({},e),{},Object(x.a)({},n,r(o,c)))}),{});return Object(E.a)(Object(E.a)({},e),{},Object(x.a)({},t,{color:o,moves:i}))}),{})},preCheckMove:function(e){var t=n(),r=t.getMarble,a=t.currentPlayer;return null===t.winner?null===a||r(e[0])===a?Promise.resolve(e):Promise.reject(C[b.WRONG_TURN]):Promise.reject(C[b.GAME_OVER])},checkMove:function(e,t){var r=Object(v.a)(e,2),a=r[0],c=r[1],o=n(),i=o.getMarble,u=o.hashMove,s=o.boardHistory,l=G[c],d=function(e){var n=Object(v.a)(e,2),t=n[0],r=n[1];return N(-S[r],t)}([a,c]),f=t[0],O=y(t);return Y(i(d))||L([a,l])?L([f,c])&&i(f)===i(O)?b.OWN_MARBLE:s.length>1&&u(c)(t)===y(s).hash?b.NO_UNDO:b.NONE:b.WRONG_DIRECTION},pushHistory:function(){var e=n(),t=e.boardHistory,r=e.board,a=e.pieces,c=e.currentPlayer,o=e.captures,i=e.hash;t.push({board:r,pieces:a,player:c,captures:o,hash:i})},init:function(){var t,r=window.location.hash.slice(1);(t=r,new Promise((function(e,n){var r=atob(t);r||n("Empty string");var a=r.split(" "),c=Object(v.a)(a,4),o=c[0],i=c[1],u=c[2],s=c[3],l="-"===s?null:W[s],b=parseInt(u);Promise.all([q(o),Q(i)]).then((function(n){var t=Object(v.a)(n,2),r=t[0],a=t[1];e({board:r,captures:a,turn:b,currentPlayer:l})})).catch(n)}))).then((function(t){var r=t.board,a=t.currentPlayer,c=t.turn,o=t.captures;if(e({board:r,pieces:K(r),turn:c,currentPlayer:a,captures:o}),e((function(e){return{moveTable:e.searchMoves()}})),null!==a){var i=n().searchMoves();e({moveTable:i});var u=_(a),s=F(i,u);0===F(i,a)?e({winner:u}):0===s&&e({winner:a})}})).catch((function(){var n=B();e(Object(E.a)(Object(E.a)({},$),{},{board:n,pieces:K(n)}))})).finally((function(){e((function(e){return{moveTable:e.searchMoves(),hash:(n=e.board,t=e.hashTable,n.reduce((function(e,n,r){return n!==s.EMPTY?e^t[r][n]:e}),0)),errorMessage:{message:"",update:0}};var n,t}))}))},setError:function(n){e({errorMessage:{message:n.toString(),update:Math.random()}})},toggleExtraTurn:function(){e((function(e){return{allowExtraTurns:!e.allowExtraTurns}}))},endTurn:function(){var t=n().currentPlayer;null!==t&&e({currentPlayer:_(t)})},updateState:function(e){return function(){var t,r,a=n(),c=a.boardHistory,o=a.allowExtraTurns,i=a.captures,u=a.currentPlayer,l=a.searchMoves,b=a.turn,d=a.board,f=l(),O=_(e),j=z(d),h=z(null!==(t=null===(r=y(c))||void 0===r?void 0:r.board)&&void 0!==t?t:B()),v=h[O]-j[O],p=h[s.RED]-j[s.RED],g=i[e]+p,m=!o||(null===u||0===v&&0===p),w=m?O:u,T=F(f,O),N=0===h[O]||g>=7||0===T;return Promise.resolve({currentPlayer:w,moveTable:N?null:f,winner:N?e:null,turn:m?b+1:b,captures:Object(E.a)(Object(E.a)({},i),{},Object(x.a)({},e,g))})}},undo:function(){var t=n(),r=t.turn,a=t.boardHistory,c=t.encode;if(!(r<=1)){var o=a.pop(),i=o.board,u=o.player,s=o.pieces,l=o.captures,b=o.hash;e((function(e){return{currentPlayer:u,captures:l,pieces:s,board:i,hash:b,winner:null,moveTable:null,turn:u!==e.currentPlayer?e.turn-1:e.turn}})),M(c())}},reset:function(){M(),n().init()},updateRoute:function(){return M(n().encode()),Promise.resolve()},encode:function(){var e=n();return function(e){var n=e.board,t=e.captures,r=e.currentPlayer,a=e.turn,c=V(n),o=J(t),i=null!==r?I[r]:"-",u=[c,o,a.toString(),i].join(" ");return btoa(u)}({board:e.board,captures:e.captures,turn:e.turn,currentPlayer:e.currentPlayer})}})})),Z=t(107),ee=t(72),ne=t(58),te=t(5),re=Object(p.a)((function(){return Object(g.a)({root:{background:function(e){switch(e.color){case"red":return"linear-gradient(135deg, #FE5B55 30%, #CC1E23 90%)";case"black":return"linear-gradient(135deg, black 30%, #666 90%)";case"white":return"linear-gradient(135deg, white 30%, #ddd 90%)";default:return"none"}},border:0,borderRadius:"50%",aspectRatio:"1",position:"absolute",cursor:function(e){return"empty"===e.color||"red"===e.color?"default":"pointer"},boxShadow:function(e){switch(e.color){case"red":return"0 3px 5px 2px rgba(255, 105, 135, .3)";case"black":return"0 3px 5px 2px rgba(25, 0, 10, .3)";case"white":return"0 3px 5px 2px rgba(0, 0, 0, .3)";default:return"none"}},userSelect:"none",touchAction:"none","&focus":{outline:"none !important"}}})})),ae=function(e){return e.makeMove},ce=Object(ne.animated)(Z.a),oe=Object(f.memo)((function(e){var n=e.color,t=e.pos,r=e.size,a=e.x,c=e.y,o=re(e),i=X(ae),u=Object(f.useCallback)((function(e){i([t,e])}),[t,i]),s=Object(ne.useSpring)((function(){return{from:{x:a,y:c},config:{mass:1,tension:225,friction:30}}})),b=Object(v.a)(s,2),d=b[0],O=d.x,j=d.y,h=b[1];Object(f.useEffect)((function(){h({x:a,y:c})}),[a,c,h]);var p=Object(ee.a)((function(e){var t=e.down,r=Object(v.a)(e.movement,2),o=r[0],i=r[1],s=e.distance;if("black"===n||"white"===n){var b=s>30;h({x:t?a+o:a,y:t?c+i:c}),!t&&b&&u(function(e){var n=Object(v.a)(e,2),t=n[0],r=n[1];return 0===t?r>0?l.DOWN:l.UP:t>0?l.RIGHT:l.LEFT}([o,i]))}}),{lockDirection:!0});return Object(te.jsx)(ce,Object(E.a)(Object(E.a)({className:o.root},p()),{},{style:{x:O,y:j,width:r}}))})),ie=Object(T.a)((function(e,n){return{gridSize:0,setGridSize:function(n){return e({gridSize:n})},calcPos:function(e){var t=n().gridSize,r=t*(1-.8)/2;return{x:t*(e%7)+r,y:t*Math.floor(e/7)+r}}}})),ue=new Array(7).fill(0).map((function(){return new Array(7).fill(0)})),se=Object(p.a)((function(e){return Object(g.a)({grid:{userSelect:"none"},paper:{padding:e.spacing(1),color:e.palette.text.secondary,aspectRatio:"1"}})})),le=function(e){return e.setGridSize},be=function(){var e=se(),n=ie(le),t=Object(f.useRef)();return Object(f.useEffect)((function(){var e=function(){if(t.current){var e,r=(null===(e=t.current)||void 0===e?void 0:e.getBoundingClientRect()).width;n(r/7)}};return e(),window.addEventListener("resize",e),function(){window.removeEventListener("resize",e)}}),[t,n]),Object(te.jsx)(m.a,{ref:t,className:e.grid,container:!0,children:ue.map((function(n,t){return Object(te.jsx)(m.a,{container:!0,item:!0,spacing:0,children:n.map((function(n,t){return Object(te.jsx)(m.a,{item:!0,xs:!0,children:Object(te.jsx)(Z.a,{className:e.paper,variant:"outlined",square:!0})},t)}))},t)}))})},de=Object(p.a)((function(e){return Object(g.a)({grid:{userSelect:"none",touchAction:"none"},paper:{padding:e.spacing(1),color:e.palette.text.secondary}})})),fe=function(e){return e.pieces},Oe=function(){var e=de(),n=X(fe),t=ie(Object(f.useCallback)((function(e){return[e.gridSize,e.calcPos]}),[])),r=Object(v.a)(t,2),a=r[0],c=r[1];return Object(te.jsxs)(m.a,{className:e.grid,container:!0,children:[Object(te.jsx)(be,{}),n.map((function(e){if(e.pos===d.OFF_GRID)return null;var n=c(e.pos),t=n.x,r=n.y;return Object(te.jsx)(oe,{color:s[e.color].toLowerCase(),size:.8*a,pos:e.pos,x:t,y:r},e.id)}))]})},je=t(78),he=t(135),ve=t(136),pe=t(142),ge=t(137),me=t(145),we=t(140),Ee=t(132),xe=t(134),Te=t(141),ye=Object(f.memo)((function(e){var n=X(Object(f.useCallback)((function(e){return[e.undo,e.turn]}),[])),t=Object(v.a)(n,2),r=t[0],a=t[1];return Object(te.jsx)(Ee.a,{variant:"contained",disabled:1===a,onClick:r,children:e.children})})),Ne=Object(f.memo)((function(e){var n=X(Object(f.useCallback)((function(e){return e.reset}),[]));return Object(te.jsx)(Ee.a,{variant:"contained",color:"secondary",onClick:n,children:e.children})})),Me=Object(f.memo)((function(e){var n=Object(f.useState)(!1),t=Object(v.a)(n,2),r=t[0],a=t[1],c=Object(f.useCallback)((function(){navigator.clipboard.writeText(window.location.href).then((function(){a(!0)}))}),[]),o=Object(f.useCallback)((function(){a(!1)}),[]);return Object(te.jsxs)(te.Fragment,{children:[Object(te.jsx)(Ee.a,{variant:"contained",onClick:c,children:e.children}),Object(te.jsx)(pe.a,{open:r,autoHideDuration:2e3,onClose:o,anchorOrigin:{vertical:"top",horizontal:"right"},children:Object(te.jsx)(we.a,{onClose:o,severity:"success",children:"Copied to clipboard"})})]})})),Re=Object(f.memo)((function(e){var n=X(Object(f.useCallback)((function(e){return[e.allowExtraTurns,e.toggleExtraTurn]}),[])),t=Object(v.a)(n,2),r=t[0],a=t[1];return Object(te.jsx)(xe.a,{control:Object(te.jsx)(Te.a,{checked:r,onChange:a}),label:e.label})})),Pe=t(144),ke=Object(p.a)({root:{outline:"none",boxShadow:"none"},title:{fontSize:"3em"},controls:{flexWrap:"wrap"},backdrop:{zIndex:999,color:"white"}}),Ce=function(){var e=ke(),n=Object(f.useState)(!1),t=Object(v.a)(n,2),r=t[0],a=t[1],c=Object(f.useState)(!1),o=Object(v.a)(c,2),i=o[0],u=o[1],l=Object(Pe.a)().t,b=X(Object(f.useCallback)((function(e){return[e.turn,e.currentPlayer,e.errorMessage,e.captures,e.winner]}),[])),d=Object(v.a)(b,5),O=d[0],j=d[1],h=d[2],p=d[3],g=d[4];Object(f.useEffect)((function(){h.message?a(!0):a(!1)}),[h]),Object(f.useEffect)((function(){null!==g&&u(!0)}),[g]);var m=Object(f.useCallback)((function(e,n){"clickaway"!==n&&a(!1)}),[]),w=Object(f.useCallback)((function(){u(!1)}),[]);return Object(te.jsxs)(te.Fragment,{children:[Object(te.jsxs)(he.a,{className:e.root,variant:"elevation",children:[Object(te.jsxs)(ve.a,{children:[Object(te.jsx)(je.a,{className:e.title,variant:"h1",component:"h1",gutterBottom:!0,children:l("title")}),Object(te.jsxs)(je.a,{children:["Turn ",O,","," ",null!==j?P(s[j]):l("anyone")]}),Object(te.jsxs)(je.a,{children:["Captures: ",l("white"),": ",p[s.WHITE],", ",l("black"),":"," ",p[s.BLACK]]}),Object(te.jsx)(pe.a,{open:r,autoHideDuration:2e3,onClose:m,anchorOrigin:{vertical:"top",horizontal:"center"},children:Object(te.jsx)(we.a,{onClose:m,severity:"warning",children:h.message})})]}),Object(te.jsxs)(ge.a,{className:e.controls,children:[Object(te.jsx)(ye,{children:l("undo")}),Object(te.jsx)(Ne,{children:l("reset")}),Object(te.jsx)(Me,{children:l("export")}),Object(te.jsx)(Re,{label:l("allowExtra")})]})]}),Object(te.jsx)(me.a,{className:e.backdrop,open:i,onClick:w,children:Object(te.jsxs)(je.a,{variant:"h1",component:"h1",children:[s[g]," wins"]})})]})},Ie=t(138),We=t(76),Se=t.n(We),Ae=Object(p.a)({root:{position:"absolute",right:0,top:0,margin:"16px 16px",color:"#777"}}),De=function(){var e=Ae();return Object(te.jsx)("div",{className:e.root,children:Object(te.jsx)(Ie.a,{href:"https://github.com/Mr-Quin/kuba",target:"_blank",rel:"noreferrer",color:"inherit",children:Object(te.jsx)(Se.a,{})})})},Ge=t(139),_e=t(60),Le=t(46);_e.a.use(Le.e).init({resources:{en:{translation:{title:"Kuba",black:"Black",white:"White",anyone:"Anyone",undo:"Undo",reset:"Reset",export:"Export",allowExtra:"Allow extra turn"}}},lng:"en",fallbackLng:"en",interpolation:{escapeValue:!1}}).then();_e.a;var He=function(){var e=X((function(e){return e.init}));return Object(f.useEffect)((function(){e()}),[e]),Object(te.jsxs)(Ge.a,{maxWidth:"sm",children:[Object(te.jsx)(Ce,{}),Object(te.jsx)(Oe,{}),Object(te.jsx)(De,{})]})},Ue=Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));function Be(e,n){navigator.serviceWorker.register(e).then((function(e){e.onupdatefound=function(){var t=e.installing;null!=t&&(t.onstatechange=function(){"installed"===t.state&&(navigator.serviceWorker.controller?(console.log("New content is available and will be used when all tabs for this page are closed. See https://cra.link/PWA."),n&&n.onUpdate&&n.onUpdate(e)):(console.log("Content is cached for offline use."),n&&n.onSuccess&&n.onSuccess(e)))})}})).catch((function(e){console.error("Error during service worker registration:",e)}))}h.a.render(Object(te.jsx)(O.a.StrictMode,{children:Object(te.jsx)(He,{})}),document.getElementById("root")),function(e){if("serviceWorker"in navigator){if(new URL("",window.location.href).origin!==window.location.origin)return;window.addEventListener("load",(function(){var n="".concat("","/service-worker.js");Ue?(!function(e,n){fetch(e,{headers:{"Service-Worker":"script"}}).then((function(t){var r=t.headers.get("content-type");404===t.status||null!=r&&-1===r.indexOf("javascript")?navigator.serviceWorker.ready.then((function(e){e.unregister().then((function(){window.location.reload()}))})):Be(e,n)})).catch((function(){console.log("No internet connection found. App is running in offline mode.")}))}(n,e),navigator.serviceWorker.ready.then((function(){console.log("This web app is being served cache-first by a service worker. To learn more, visit https://cra.link/PWA")}))):Be(n,e)}))}}()},90:function(e,n,t){}},[[106,1,2]]]);