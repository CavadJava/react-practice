import { Request, Response } from 'express';
import pool from '../config/db';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query('SELECT * FROM customers ORDER BY customer_id DESC');
        
        // Java response formatına tam uyğun qaytarırıq
        res.status(200).json({
            result: result.rows.map(row => ({
                customerId: row.customer_id.toString(),
                pin: row.pin,
                docNumber: row.doc_number,
                phoneNumber: row.phone_number,
                firstName: row.first_name,
                lastName: row.last_name,
                middle_name: row.middle_name,
                address: row.address,
                email: row.email
            })),
            code: 0,
            message: 'Success'
        });
    } catch (error: any) {
        res.status(500).json({
            result: [],
            code: 1,
            message: error.message || 'Daxili server xətası baş verdi.'
        });
    }
};