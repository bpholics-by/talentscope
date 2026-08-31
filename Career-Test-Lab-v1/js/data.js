/* ==========================================================
   CAREER TEST LAB
   DATA STORE
   Version 1.0.0
========================================================== */

const dashboardData = {

    statistics: {

        assessments: 12,

        participants: 999,

        progress: 86,

        duration: 32

    },

    activity: [

        {

            title: "Assessment selesai",

            description: "15 peserta menyelesaikan assessment.",

            color: "blue"

        },

        {

            title: "Peserta baru",

            description: "8 peserta berhasil didaftarkan.",

            color: "green"

        },

        {

            title: "Laporan dibuat",

            description: "PDF assessment berhasil dibuat.",

            color: "orange"

        }

    ]

};

document.addEventListener("DOMContentLoaded", function () {
    const scheduleContainer = document.getElementById("assessmentScheduleList");
    if (!scheduleContainer) return;

    // Tambahkan baris ini untuk memaksa kontainer induk tidak saling menempel rapat
    scheduleContainer.style.display = 'block';

    let schedules = [];
    try {
        const projects = JSON.parse(localStorage.getItem('talentscope_projects') || localStorage.getItem('projects') || '[]');
        const today = new Date('2026-08-24T00:00:00');
        
        projects.forEach(proj => {
    const rawSchedule = proj.scheduleDate || proj.date || proj.createdAt;
    
    if (rawSchedule) {
        // Ambil tanggal pertama jika berupa rentang
        const rawDateStr = rawSchedule.includes(' - ') ? rawSchedule.split(' - ')[0].trim() : rawSchedule.trim();
        
        // Ubah string tanggal menjadi objek Date secara aman
        const projDate = new Date(rawDateStr);
        
        // Jika gagal terbaca, coba parsing manual jika formatnya "DD MMM YYYY"
        if (isNaN(projDate.getTime())) {
            console.warn("Format tanggal tidak dikenali:", rawDateStr);
            return;
        }

        const todayCopy = new Date(today); 
        
        const diffTime = projDate.setHours(0,0,0,0) - todayCopy.setHours(0,0,0,0);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        console.log("Proyek:", proj.name, "| Tanggal:", rawDateStr, "| Selisih Hari (diffDays):", diffDays);

        if (diffDays >= -2 && diffDays <= 2) {
            let badgeText = '';
            let hexColor = '#3b82f6';
            
            if (diffDays === 0) {
                badgeText = 'Hari Ini';
                hexColor = '#10b981';
            } else if (diffDays === -1) {
                badgeText = 'Kemarin';
                hexColor = '#f59e0b';
            } else if (diffDays === -2) {
                badgeText = '2 Hari Lalu';
                hexColor = '#64748b';
            } else if (diffDays === 1) {
                badgeText = 'Besok';
                hexColor = '#8b5cf6'; // Ungu untuk besok
            } else if (diffDays === 2) {
                badgeText = '2 Hari Lagi';
                hexColor = '#06b6d4';
            }

            schedules.push({
                title: proj.name || proj.projectName || 'Proyek Asesmen',
                desc: `Klien/Perusahaan: ${proj.company || proj.perusahaan || 'Umum'}`,
                badge: badgeText,
                color: hexColor,
                dateObj: new Date(projDate)
            });
        }
    }
});



    } catch (e) {
        console.error("Gagal memuat jadwal:", e);
    }

    if (schedules.length === 0) {
        scheduleContainer.innerHTML = `<p style="padding: 10px; color: #64748b; font-size: 13px;">Tidak ada jadwal asesmen dalam rentang H-2 s.d. H+2.</p>`;
        return;
    }

    schedules.sort((a, b) => a.dateObj - b.dateObj);

    scheduleContainer.innerHTML = schedules.map(sch => `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${sch.color}; box-shadow: 0 0 0 4px ${sch.color}20; flex-shrink: 0;"></div>
                <div>
                    <strong style="font-size: 14px; color: #1e293b; display: block; margin-bottom: 4px;">${sch.title}</strong>
                    <p style="margin: 0; font-size: 12.5px; color: #64748b;">${sch.desc}</p>
                </div>
            </div>
            <span style="font-size: 11.5px; padding: 6px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-weight: 600; color: #475569; flex-shrink: 0;">${sch.badge}</span>
        </div>
    `).join('');
});