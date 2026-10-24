const { Prisma } = require('@prisma/client');
const crypto = require('crypto');

class MockDatabase {
  constructor() {
    this.users = [];
    this.loans = [];
    this.friends = [];
    this.payments = [];
    this.reminders = [];
    this.notifications = [];
  }

  reset() {
    this.users = [];
    this.loans = [];
    this.friends = [];
    this.payments = [];
    this.reminders = [];
    this.notifications = [];
  }

  // --- User Model Mock ---
  get user() {
    return {
      upsert: jest.fn(async ({ where, create, update = {} }) => {
        let existing = this.users.find((u) => u.phoneNumber === where.phoneNumber);
        if (existing) {
          if (update.name) existing.name = update.name;
          if (update.email) existing.email = update.email;
          return existing;
        }

        const newUser = {
          id: crypto.randomUUID(),
          phoneNumber: create.phoneNumber,
          name: create.name || null,
          email: create.email || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.users.push(newUser);
        return newUser;
      }),

      findUnique: jest.fn(async ({ where }) => {
        return this.users.find((u) => u.id === where.id || (where.phoneNumber && u.phoneNumber === where.phoneNumber)) || null;
      }),
    };
  }

  // --- Friend Model Mock ---
  get friend() {
    return {
      create: jest.fn(async ({ data }) => {
        const newFriend = {
          id: crypto.randomUUID(),
          userId: data.userId,
          name: data.name,
          phone: data.phone || data.phoneNumber || null,
          phoneNumber: data.phoneNumber || data.phone || null,
          email: data.email || null,
          notes: data.notes || null,
        };
        this.friends.push(newFriend);
        return newFriend;
      }),

      findFirst: jest.fn(async ({ where }) => {
        return this.friends.find((f) => {
          if (where.id && f.id !== where.id) return false;
          if (where.userId && f.userId !== where.userId) return false;
          if (where.name && f.name.toLowerCase() !== where.name.toLowerCase()) return false;
          return true;
        }) || null;
      }),

      findMany: jest.fn(async () => this.friends),

      update: jest.fn(async ({ where, data }) => {
        const friend = this.friends.find((f) => f.id === where.id);
        if (!friend) throw new Error('Friend not found');
        if (data.name !== undefined) friend.name = data.name;
        if (data.phoneNumber !== undefined) friend.phoneNumber = data.phoneNumber;
        if (data.phone !== undefined) friend.phone = data.phone;
        if (data.email !== undefined) friend.email = data.email;
        if (data.notes !== undefined) friend.notes = data.notes;
        return friend;
      }),

      delete: jest.fn(async ({ where }) => {
        const index = this.friends.findIndex((f) => f.id === where.id);
        if (index === -1) throw new Error('Friend not found');
        return this.friends.splice(index, 1)[0];
      }),
    };
  }

  // --- Payment Model Mock ---
  get payment() {
    return {
      create: jest.fn(async ({ data }) => {
        const p = {
          id: crypto.randomUUID(),
          userId: data.userId,
          loanId: data.loanId,
          amount: new Prisma.Decimal(data.amount.toString()),
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          paymentMethod: data.paymentMethod || 'UPI',
          reference: data.reference || null,
          receiptUrl: data.receiptUrl || null,
          notes: data.notes || null,
        };
        this.payments.push(p);
        return p;
      }),

      findFirst: jest.fn(async ({ where }) => {
        return this.payments.find((p) => {
          if (where.id && p.id !== where.id) return false;
          if (where.userId && p.userId !== where.userId) return false;
          if (where.loanId && p.loanId !== where.loanId) return false;
          return true;
        }) || null;
      }),

      findMany: jest.fn(async ({ where }) => {
        return this.payments.filter((p) => {
          if (where?.userId && p.userId !== where.userId) return false;
          if (where?.loanId && p.loanId !== where.loanId) return false;
          return true;
        });
      }),

      update: jest.fn(async ({ where, data }) => {
        const p = this.payments.find((x) => x.id === where.id);
        if (!p) throw new Error('Payment not found');
        if (data.paymentMethod !== undefined) p.paymentMethod = data.paymentMethod;
        if (data.reference !== undefined) p.reference = data.reference;
        if (data.receiptUrl !== undefined) p.receiptUrl = data.receiptUrl;
        if (data.notes !== undefined) p.notes = data.notes;
        return p;
      }),

      delete: jest.fn(async ({ where }) => {
        const index = this.payments.findIndex((x) => x.id === where.id);
        if (index === -1) throw new Error('Payment not found');
        return this.payments.splice(index, 1)[0];
      }),
    };
  }

  // --- Reminder Model Mock ---
  get reminder() {
    return {
      create: jest.fn(async ({ data }) => {
        const r = {
          id: crypto.randomUUID(),
          userId: data.userId,
          loanId: data.loanId,
          reminderDateTime: new Date(data.reminderDateTime),
          reminderType: data.reminderType || 'DUE_DATE',
          channel: data.channel || 'IN_APP',
          status: data.status || 'PENDING',
          notes: data.notes || null,
        };
        this.reminders.push(r);
        return r;
      }),

      findMany: jest.fn(async ({ where }) => {
        return this.reminders.filter((r) => {
          if (where?.userId && r.userId !== where.userId) return false;
          if (where?.loanId && r.loanId !== where.loanId) return false;
          if (where?.status && r.status !== where.status) return false;
          return true;
        });
      }),

      findFirst: jest.fn(async ({ where }) => {
        return this.reminders.find((r) => {
          if (where.id && r.id !== where.id) return false;
          if (where.userId && r.userId !== where.userId) return false;
          return true;
        }) || null;
      }),

      update: jest.fn(async ({ where, data }) => {
        const r = this.reminders.find((x) => x.id === where.id);
        if (!r) throw new Error('Reminder not found');
        Object.assign(r, data);
        return r;
      }),

      delete: jest.fn(async ({ where }) => {
        const index = this.reminders.findIndex((x) => x.id === where.id);
        if (index === -1) throw new Error('Reminder not found');
        return this.reminders.splice(index, 1)[0];
      }),
    };
  }

  // --- Notification Model Mock ---
  get notification() {
    return {
      create: jest.fn(async ({ data }) => {
        const n = {
          id: crypto.randomUUID(),
          userId: data.userId,
          loanId: data.loanId || null,
          title: data.title,
          message: data.message,
          type: data.type || 'INFO',
          readAt: null,
          createdAt: new Date(),
        };
        this.notifications.push(n);
        return n;
      }),

      findMany: jest.fn(async ({ where }) => {
        return this.notifications.filter((n) => {
          if (where?.userId && n.userId !== where.userId) return false;
          if (where?.readAt === null && n.readAt !== null) return false;
          return true;
        });
      }),

      findFirst: jest.fn(async ({ where }) => {
        return this.notifications.find((n) => {
          if (where.id && n.id !== where.id) return false;
          if (where.userId && n.userId !== where.userId) return false;
          return true;
        }) || null;
      }),

      update: jest.fn(async ({ where, data }) => {
        const n = this.notifications.find((x) => x.id === where.id);
        if (!n) throw new Error('Notification not found');
        if (data.readAt !== undefined) n.readAt = data.readAt;
        return n;
      }),

      updateMany: jest.fn(async ({ where, data }) => {
        let count = 0;
        this.notifications.forEach((n) => {
          if (where?.userId && n.userId !== where.userId) return;
          if (where?.readAt === null && n.readAt !== null) return;
          if (data.readAt !== undefined) n.readAt = data.readAt;
          count++;
        });
        return { count };
      }),
    };
  }

  // --- Loan Model Mock ---
  get loan() {
    return {
      create: jest.fn(async ({ data }) => {
        const newLoan = {
          id: crypto.randomUUID(),
          userId: data.userId,
          friendName: data.friendName,
          type: data.type || 'LENT',
          amount: new Prisma.Decimal(data.amount.toString()),
          totalPaid: new Prisma.Decimal('0.00'),
          remainingBalance: new Prisma.Decimal(data.amount.toString()),
          dueDate: new Date(data.dueDate),
          isRepaid: false,
          repaidAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.loans.push(newLoan);
        return newLoan;
      }),

      findFirst: jest.fn(async ({ where }) => {
        return (
          this.loans.find((l) => {
            if (where.id && l.id !== where.id) return false;
            if (where.userId && l.userId !== where.userId) return false;
            return true;
          }) || null
        );
      }),

      findMany: jest.fn(async ({ where, skip = 0, take = 50, orderBy, select }) => {
        let filtered = this.loans.filter((l) => {
          if (where?.userId && l.userId !== where.userId) return false;
          if (where?.isRepaid !== undefined && l.isRepaid !== where.isRepaid) return false;
          if (where?.dueDate?.lt && !(l.dueDate < where.dueDate.lt)) return false;
          if (where?.friendName?.contains) {
            const query = where.friendName.contains.toLowerCase();
            if (!l.friendName.toLowerCase().includes(query)) return false;
          }
          return true;
        });

        if (orderBy) {
          const key = Object.keys(orderBy)[0];
          const direction = orderBy[key];
          filtered.sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        }

        const sliced = filtered.slice(skip, skip + take);

        if (select) {
          return sliced.map((item) => {
            const res = {};
            for (const key of Object.keys(select)) {
              if (select[key]) res[key] = item[key];
            }
            return res;
          });
        }

        return sliced;
      }),

      count: jest.fn(async ({ where }) => {
        return this.loans.filter((l) => {
          if (where?.userId && l.userId !== where.userId) return false;
          if (where?.isRepaid !== undefined && l.isRepaid !== where.isRepaid) return false;
          if (where?.dueDate?.lt && !(l.dueDate < where.dueDate.lt)) return false;
          if (where?.friendName?.contains) {
            const query = where.friendName.contains.toLowerCase();
            if (!l.friendName.toLowerCase().includes(query)) return false;
          }
          return true;
        }).length;
      }),

      update: jest.fn(async ({ where, data }) => {
        const loan = this.loans.find((l) => l.id === where.id);
        if (!loan) throw new Error('Loan not found');

        if (data.isRepaid !== undefined) loan.isRepaid = data.isRepaid;
        if (data.repaidAt !== undefined) loan.repaidAt = data.repaidAt;
        if (data.totalPaid !== undefined) loan.totalPaid = new Prisma.Decimal(data.totalPaid.toString());
        if (data.remainingBalance !== undefined) loan.remainingBalance = new Prisma.Decimal(data.remainingBalance.toString());
        loan.updatedAt = new Date();

        return loan;
      }),
    };
  }
}

const mockDb = new MockDatabase();
module.exports = { mockDb };
