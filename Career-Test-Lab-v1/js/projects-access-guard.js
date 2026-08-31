/* TalentScope Project Access Guard - rebuilt
   Session is authoritative. No profile fallback.
   Client/Asesor can only see assigned projects. Asesor is view-only.
*/
(function(){
  "use strict";
  const PROJECT_KEY="talentscope_projects";

  function role(){
    const s=window.TalentScopeAuth && window.TalentScopeAuth.getSession ? window.TalentScopeAuth.getSession() : null;
    return s ? window.TalentScopeAuth.normalizeRole(s.role) : "";
  }
  function session(){ return window.TalentScopeAuth ? window.TalentScopeAuth.getSession() : null; }
  function norm(v){return String(v??"").trim().toLowerCase();}
  function ids(u){return [u&&u.id,u&&u.username,u&&u.email,u&&u.name].filter(Boolean).map(norm);}
  function projectIds(p){return [p&&p.clientId,p&&p.client_id,p&&p.clientUsername,p&&p.clientEmail,p&&p.clientName,p&&p.ownerId,p&&p.ownerEmail,p&&p.assignedClientId,p&&p.assignedClientEmail,p&&p.asesorId,p&&p.asesorEmail,p&&p.assignedAsesorId,p&&p.assignedAsesorEmail].filter(Boolean).map(norm);}
  function assignedTo(p,u){
    const pi=projectIds(p), ui=ids(u);
    return pi.length>0 && ui.some(x=>pi.includes(x));
  }
  function load(){
    try{
      const v=JSON.parse(localStorage.getItem(PROJECT_KEY)||"[]");
      return Array.isArray(v)?v:[];
    }catch(_){return [];}
  }
  function visibleProjects(){
    const s=session(); const r=role(); const all=load();
    if(!s) return [];
    if(r==="System Administrator"||r==="Administrator") return all;
    if(r==="Client"||r==="Asesor") return all.filter(p=>assignedTo(p,s));
    return [];
  }
  window.tsProjectAccess={
    role,session,load,visibleProjects,
    canEdit:()=>role()==="System Administrator"||role()==="Administrator",
    canDelete:()=>role()==="System Administrator"||role()==="Administrator",
    canAssign:()=>role()==="System Administrator"||role()==="Administrator"
  };
})();
