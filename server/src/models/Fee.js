const pool = require("../config/db");

const createFee = async (data) => {
  const query = `
    INSERT INTO fees (
      student_id,
      amount,
      fee_type,
      payment_status,
      payment_date
    )
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
  `;
  const values = [
    data.student_id,
    data.amount,
    data.fee_type,
    data.payment_status || "unpaid",
    data.payment_date || null,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const getFeesByStudent = async (student_id) => {
  const { rows } = await pool.query(
    "SELECT * FROM fees WHERE student_id = $1 ORDER BY created_at DESC",
    [student_id],
  );
  return rows;
};

const getAllFees = async () => {
  const { rows } = await pool.query(
    "SELECT * FROM fees ORDER BY created_at DESC",
  );
  return rows;
};

const updateFeeStatus = async (id, status, payment_date) => {
  const { rows } = await pool.query(
    "UPDATE fees SET payment_status = $1, payment_date = $2 WHERE id = $3 RETURNING *",
    [status, payment_date, id],
  );
  return rows[0];
};

module.exports = {
  createFee,
  getFeesByStudent,
  getAllFees,
  updateFeeStatus,
};
