const { z } = require('zod');

const createLoanSchema = z.object({
  body: z.object({
    friendName: z
      .string({ required_error: 'Friend name is required' })
      .trim()
      .min(1, 'Friend name cannot be empty')
      .max(100, 'Friend name cannot exceed 100 characters'),
    amount: z
      .preprocess(
        (val) => (typeof val === 'string' ? parseFloat(val) : val),
        z
          .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
          .positive('Loan amount must be strictly greater than 0')
          .max(1000000000, 'Loan amount is too large')
          .refine(
            (val) => {
              const str = val.toString();
              const decimalPart = str.split('.')[1];
              return !decimalPart || decimalPart.length <= 2;
            },
            { message: 'Amount can have at most 2 decimal places' }
          )
      ),
    dueDate: z
      .string({ required_error: 'Due date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid due date format. Please provide a valid ISO date string (YYYY-MM-DD)',
      })
      .transform((val) => new Date(val)),
  }),
});

const getLoansQuerySchema = z.object({
  query: z.object({
    status: z
      .string()
      .optional()
      .transform((val) => (val ? val.toUpperCase() : 'ALL'))
      .pipe(z.enum(['ALL', 'OUTSTANDING', 'REPAID', 'OVERDUE'])),
    search: z.string().trim().optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().min(1, 'Page must be at least 1')),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .pipe(z.number().min(1).max(100, 'Limit cannot exceed 100')),
    sortBy: z
      .enum(['createdAt', 'dueDate', 'amount', 'friendName'])
      .optional()
      .default('createdAt'),
    sortOrder: z
      .string()
      .optional()
      .transform((val) => (val && val.toLowerCase() === 'asc' ? 'asc' : 'desc'))
      .pipe(z.enum(['asc', 'desc'])),
  }),
});

const loanIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid loan ID format (must be a valid UUID)'),
  }),
});

module.exports = {
  createLoanSchema,
  getLoansQuerySchema,
  loanIdParamSchema,
};
