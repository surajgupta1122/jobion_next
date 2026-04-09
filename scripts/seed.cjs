/* eslint-disable no-console */
require("dotenv").config();
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");

function must(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env var ${name}. Create .env from .env.example`);
  }
  return v;
}

function asInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function main() {
  const host = must("DB_HOST");
  const user = must("DB_USER");
  const password = process.env.DB_PASSWORD || "";
  const database = must("DB_NAME");
  const jwtSecret = must("JWT_SECRET");

  const connectionLimit = asInt(process.env.DB_SEED_CONNECTION_LIMIT, 4);

  const db = await mysql.createPool({
    host,
    user,
    password,
    database,
    connectionLimit,
    multipleStatements: true,
  });

  console.log("Seeding DB:", { host, user, database });

  // Core tables used by API routes in /app/api/**
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NULL,
      role ENUM('candidate','recruiter','admin') NOT NULL DEFAULT 'candidate',
      password_hash VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME NULL
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS job_roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      _id VARCHAR(64) NULL,
      role_id INT NULL,
      recruiter_id INT NULL,
      company VARCHAR(255) NOT NULL,
      job_type VARCHAR(50) NULL,
      work_mode VARCHAR(50) NULL,
      country VARCHAR(120) NULL,
      state VARCHAR(120) NULL,
      city VARCHAR(120) NULL,
      locality VARCHAR(255) NULL,
      vacancies INT NULL,
      min_experience INT NULL,
      max_experience INT NULL,
      min_salary INT NULL,
      max_salary INT NULL,
      description MEDIUMTEXT NULL,
      interview_address VARCHAR(255) NULL,
      contact_email VARCHAR(255) NULL,
      contact_phone VARCHAR(50) NULL,
      show_interview_address TINYINT(1) NOT NULL DEFAULT 1,
      show_contact_phone TINYINT(1) NOT NULL DEFAULT 1,
      logo_path VARCHAR(255) NULL,
      status ENUM('pending','approved','rejected','closed') NOT NULL DEFAULT 'pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      posted_at DATETIME NULL,
      expires_at DATETIME NULL,
      CONSTRAINT fk_jobs_role FOREIGN KEY (role_id) REFERENCES job_roles(id) ON DELETE SET NULL,
      CONSTRAINT fk_jobs_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_jobs_status_created (status, created_at),
      INDEX idx_jobs_city (city)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS job_tags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(64) NOT NULL UNIQUE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS job_tag_map (
      job_id INT NOT NULL,
      tag_id INT NOT NULL,
      PRIMARY KEY (job_id, tag_id),
      CONSTRAINT fk_jtm_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      CONSTRAINT fk_jtm_tag FOREIGN KEY (tag_id) REFERENCES job_tags(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS saved_jobs (
      user_id INT NOT NULL,
      job_id INT NOT NULL,
      saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, job_id),
      CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_saved_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS job_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id INT NOT NULL,
      user_id INT NOT NULL,
      status VARCHAR(32) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NULL,
      UNIQUE KEY uniq_apply (job_id, user_id),
      CONSTRAINT fk_app_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      CONSTRAINT fk_app_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS candidate_profiles (
      user_id INT PRIMARY KEY,
      full_name VARCHAR(255) NULL,
      phone VARCHAR(50) NULL,
      date_of_birth DATE NULL,
      gender VARCHAR(50) NULL,
      city VARCHAR(120) NULL,
      state VARCHAR(120) NULL,
      country VARCHAR(120) NULL,
      highest_qualification VARCHAR(255) NULL,
      trade_stream VARCHAR(255) NULL,
      job_type VARCHAR(50) NULL,
      availability VARCHAR(50) NULL,
      expected_salary INT NULL,
      id_proof_available TINYINT(1) NULL,
      experience_years INT NULL,
      linkedin_url VARCHAR(255) NULL,
      github_url VARCHAR(255) NULL,
      resume_path VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_candidate_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS recruiter_profiles (
      user_id INT PRIMARY KEY,
      company_name VARCHAR(255) NULL,
      website VARCHAR(255) NULL,
      phone VARCHAR(50) NULL,
      address VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_recruiter_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_notif_user (user_id, created_at)
    ) ENGINE=InnoDB;
  `);

  // Seed base roles/tags
  const roleNames = ["Software Engineer", "Frontend Developer", "Backend Developer", "UI/UX Designer"];
  for (const name of roleNames) {
    await db.query("INSERT IGNORE INTO job_roles (name) VALUES (?)", [name]);
  }

  const tagNames = ["React", "Next.js", "TypeScript", "Node.js", "MySQL", "Tailwind"];
  for (const name of tagNames) {
    await db.query("INSERT IGNORE INTO job_tags (name) VALUES (?)", [name]);
  }

  // Seed users
  await db.query(
    "INSERT IGNORE INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)",
    ["recruiter@test.com", "Recruiter Test", "recruiter", ""],
  );
  await db.query(
    "INSERT IGNORE INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)",
    ["candidate@test.com", "Candidate Test", "candidate", ""],
  );
  await db.query(
    "INSERT IGNORE INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)",
    ["admin@test.com", "Admin Test", "admin", ""],
  );

  const [[recruiter]] = await db.query("SELECT * FROM users WHERE email = ? LIMIT 1", ["recruiter@test.com"]);
  const [[candidate]] = await db.query("SELECT * FROM users WHERE email = ? LIMIT 1", ["candidate@test.com"]);
  const [[admin]] = await db.query("SELECT * FROM users WHERE email = ? LIMIT 1", ["admin@test.com"]);

  // Seed profiles (optional but helps dashboards)
  await db.query(
    `INSERT IGNORE INTO recruiter_profiles
      (user_id, company_name, company_website, hr_name, hr_mobile, address_line1, city, state, country, pincode, status)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recruiter.id,
      "Jobion Demo Co",
      "https://example.com",
      "HR Demo",
      "9999999999",
      "Demo Street",
      "Mumbai",
      "Maharashtra",
      "India",
      "400001",
      "approved",
    ],
  );

  await db.query(
    "INSERT IGNORE INTO candidate_profiles (user_id, full_name, phone, city, state, country, highest_qualification, trade_stream, experience_years) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [candidate.id, "Candidate Test", "8888888888", "Mumbai", "Maharashtra", "India", "BSc", "Computer Science", 2],
  );

  // Seed jobs
  const [[roleRow]] = await db.query("SELECT id FROM job_roles ORDER BY id ASC LIMIT 1");
  const roleId = roleRow?.id ?? null;

  // Insert a couple jobs (ignore duplicates by unique heuristic on company+city+role_id+recruiter_id)
  // Since we don't have a unique constraint, we select first to keep seed idempotent.
  const jobSeed = [
    {
      company: "Jobion Demo Co",
      city: "Mumbai",
      state: "Maharashtra",
      work_mode: "Office",
      job_type: "Full-time",
      description: "Demo job for local testing.",
      tags: ["React", "Next.js", "MySQL"],
      status: "approved",
    },
    {
      company: "Acme Labs",
      city: "Pune",
      state: "Maharashtra",
      work_mode: "Hybrid",
      job_type: "Internship",
      description: "Second demo job for local testing.",
      tags: ["TypeScript", "Tailwind"],
      status: "pending",
    },
  ];

  const insertedJobIds = [];
  for (const j of jobSeed) {
    const [existing] = await db.query(
      "SELECT id FROM jobs WHERE recruiter_id=? AND company=? AND city=? AND COALESCE(role_id,0)=COALESCE(?,0) LIMIT 1",
      [recruiter.id, j.company, j.city, roleId],
    );

    let jobId = existing?.[0]?.id;
    if (!jobId) {
      const [res] = await db.query(
        `
        INSERT INTO jobs
          (role_id, recruiter_id, company, job_type, work_mode, country, state, city, locality,
           vacancies, min_experience, max_experience, min_salary, max_salary,
           description, interview_address, contact_email, contact_phone,
           show_interview_address, show_contact_phone,
           status, created_at, posted_at, expires_at)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?,
           ?, ?, ?, ?, ?,
           ?, ?, ?, ?,
           ?, ?,
           ?, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))
        `,
        [
          roleId,
          recruiter.id,
          j.company,
          j.job_type,
          j.work_mode,
          "India",
          j.state,
          j.city,
          "Demo locality",
          5,
          0,
          3,
          30000,
          80000,
          j.description,
          "Demo interview address",
          "hr@" + j.company.toLowerCase().replace(/\s+/g, "") + ".test",
          "7000000000",
          1,
          1,
          j.status,
        ],
      );
      jobId = res?.insertId;
    }
    if (jobId) {
      insertedJobIds.push(jobId);

      for (const tagName of j.tags) {
        const [[tag]] = await db.query("SELECT id FROM job_tags WHERE name = ? LIMIT 1", [tagName]);
        if (tag?.id) {
          await db.query("INSERT IGNORE INTO job_tag_map (job_id, tag_id) VALUES (?, ?)", [jobId, tag.id]);
        }
      }
    }
  }

  const firstJobId = insertedJobIds[0];
  if (firstJobId) {
    await db.query("INSERT IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)", [candidate.id, firstJobId]);
    await db.query("INSERT IGNORE INTO job_applications (job_id, user_id, status) VALUES (?, ?, ?)", [
      firstJobId,
      candidate.id,
      "applied",
    ]);
  }

  // Generate tokens for quick API testing
  const recruiterToken = jwt.sign(
    { id: recruiter.id, email: recruiter.email, role: recruiter.role, name: recruiter.name },
    jwtSecret,
    { expiresIn: "7d" },
  );
  const candidateToken = jwt.sign(
    { id: candidate.id, email: candidate.email, role: candidate.role, name: candidate.name },
    jwtSecret,
    { expiresIn: "7d" },
  );
  const adminToken = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role, name: admin.name },
    jwtSecret,
    { expiresIn: "7d" },
  );

  console.log("\nSeed complete.\n");
  console.log("Test accounts:");
  console.log("- recruiter:", recruiter.email);
  console.log("- candidate:", candidate.email);
  console.log("- admin:", admin.email);

  console.log("\nDev cookies (set as cookie named 'token'):");
  console.log("- recruiter token:", recruiterToken);
  console.log("- candidate token:", candidateToken);
  console.log("- admin token:", adminToken);

  console.log("\nQuick smoke URLs:");
  console.log("- GET  /api/jobs");
  console.log("- GET  /api/jobs/filters");
  console.log("- GET  /api/jobs/saved-jobs   (needs token cookie)");
  console.log("- POST /api/jobs/apply/<jobId> (needs token cookie)");

  await db.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

