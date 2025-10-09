import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'absenta13',
  connectionLimit: 10,
};

const db = mysql.createPool(dbConfig);

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || 'absenta-pepper-2025';

const generateFullDaySchedules = async () => {
  console.log('🚀 Generating comprehensive full-day schedule data...');

  try {
    // Clear existing schedules
    console.log('🗑️ Clearing existing schedules...');
    await db.execute('DELETE FROM jadwal');
    console.log('✅ Existing schedules cleared.');

    // Fetch existing data
    console.log('📊 Fetching existing data...');
    const [kelasRows] = await db.execute('SELECT id_kelas, nama_kelas FROM kelas WHERE status = "aktif"');
    const [mapelRows] = await db.execute('SELECT id_mapel, nama_mapel FROM mapel WHERE status = "aktif"');
    const [guruRows] = await db.execute('SELECT id_guru, nama FROM guru WHERE status = "aktif"');
    const [ruangRows] = await db.execute('SELECT id, nama_ruang FROM ruang_kelas');

    if (kelasRows.length === 0 || mapelRows.length === 0 || guruRows.length === 0 || ruangRows.length === 0) {
      console.warn('⚠️ Not enough data to generate schedules. Please ensure kelas, mapel, guru, and ruang_kelas tables have active entries.');
      return;
    }

    console.log(`📚 Found ${kelasRows.length} classes, ${mapelRows.length} subjects, ${guruRows.length} teachers, ${ruangRows.length} rooms`);

    const kelasIds = kelasRows.map(row => row.id_kelas);
    const mapelIds = mapelRows.map(row => row.id_mapel);
    const guruIds = guruRows.map(row => row.id_guru);
    const ruangIds = ruangRows.map(row => row.id);

    // Define schedule parameters
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const startHour = 7; // 7 AM
    const endHour = 16; // 4 PM
    const classDurationMinutes = 90; // 1 hour 30 minutes
    const breakDurationMinutes = 15; // 15 minutes break

    const schedules = [];
    let totalSchedules = 0;

    // Generate schedules for each day
    for (const day of days) {
      console.log(`📅 Generating schedules for ${day}...`);
      let currentHour = startHour;
      let jamKe = 1;

      while (currentHour < endHour) {
        const jamMulai = `${String(Math.floor(currentHour)).padStart(2, '0')}:${String(Math.round((currentHour - Math.floor(currentHour)) * 60)).padStart(2, '0')}:00`;
        const classEndHour = currentHour + (classDurationMinutes / 60);
        const jamSelesai = `${String(Math.floor(classEndHour)).padStart(2, '0')}:${String(Math.round((classEndHour - Math.floor(classEndHour)) * 60)).padStart(2, '0')}:00`;

        // Ensure jamSelesai does not exceed endHour
        if (classEndHour > endHour) {
          break; // Stop if the class would go past the end hour
        }

        // Create schedules for each class
        for (let i = 0; i < kelasIds.length; i++) {
          const kelas_id = kelasIds[i];
          const mapel_id = mapelIds[i % mapelIds.length];
          const guru_id = guruIds[i % guruIds.length];
          const ruang_id = ruangIds[i % ruangIds.length];

          schedules.push([
            kelas_id,
            mapel_id,
            guru_id,
            ruang_id,
            day,
            jamKe,
            jamMulai,
            jamSelesai,
            'aktif'
          ]);
          totalSchedules++;
        }

        currentHour += (classDurationMinutes + breakDurationMinutes) / 60;
        jamKe++;
      }
    }

    // Insert schedules in batches
    if (schedules.length > 0) {
      console.log(`💾 Inserting ${schedules.length} schedules...`);
      
      const batchSize = 100;
      for (let i = 0; i < schedules.length; i += batchSize) {
        const batch = schedules.slice(i, i + batchSize);
        const insertQuery = `
          INSERT INTO jadwal (kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai, status)
          VALUES ?
        `;
        await db.query(insertQuery, [batch]);
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(schedules.length / batchSize)}`);
      }
      
      console.log(`🎉 Successfully inserted ${totalSchedules} comprehensive schedules!`);
      
      // Display summary
      console.log('\n📊 Schedule Summary:');
      console.log(`- Days: ${days.join(', ')}`);
      console.log(`- Time: ${startHour}:00 - ${endHour}:00`);
      console.log(`- Classes per day: ${kelasIds.length}`);
      console.log(`- Total schedules: ${totalSchedules}`);
      console.log(`- Schedules per class: ${Math.floor(totalSchedules / kelasIds.length)}`);
      
      // Show sample schedules
      console.log('\n📋 Sample Schedules:');
      const [sampleRows] = await db.execute(`
        SELECT 
          j.hari,
          j.jam_ke,
          j.jam_mulai,
          j.jam_selesai,
          k.nama_kelas,
          m.nama_mapel,
          g.nama,
          r.nama_ruang
        FROM jadwal j
        JOIN kelas k ON j.kelas_id = k.id_kelas
        JOIN mapel m ON j.mapel_id = m.id_mapel
        JOIN guru g ON j.guru_id = g.id_guru
        JOIN ruang_kelas r ON j.ruang_id = r.id
        ORDER BY j.hari, j.jam_ke, k.nama_kelas
        LIMIT 10
      `);
      
      sampleRows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.hari} - Jam ${row.jam_ke} (${row.jam_mulai} - ${row.jam_selesai}) | ${row.nama_kelas} | ${row.nama_mapel} | ${row.nama} | ${row.nama_ruang}`);
      });
      
    } else {
      console.log('❌ No schedules generated.');
    }
  } catch (error) {
    console.error('❌ Error generating full-day schedules:', error);
  } finally {
    await db.end();
  }
};

generateFullDaySchedules();
