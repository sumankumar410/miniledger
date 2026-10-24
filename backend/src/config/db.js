const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient, Prisma } = require('@prisma/client');
const { env } = require('./env');

const DB_FILE = path.join(__dirname, '../../dev_data.json');

const realPrisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['error'] : ['error'],
});

let isPostgresConnected = false;

realPrisma
  .$connect()
  .then(() => {
    isPostgresConnected = true;
    console.log('✅ PostgreSQL connected successfully (localhost:5432).');
  })
  .catch(() => {
    isPostgresConnected = false;
    console.log('ℹ️  PostgreSQL not detected locally. Running with local development store.');
  });

const loadLocalData = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        users: parsed.users || [],
        friends: parsed.friends || [],
        loans: parsed.loans || [],
        payments: parsed.payments || [],
        reminders: parsed.reminders || [],
        notifications: parsed.notifications || [],
        reminderSettings: parsed.reminderSettings || {},
      };
    }
  } catch (e) {
    // ignore
  }
  return { users: [], friends: [], loans: [], payments: [], reminders: [], notifications: [], reminderSettings: {} };
};

const saveLocalData = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
};

const localStore = {
  user: {
    async upsert({ where, create, update = {} }) {
      const data = loadLocalData();
      let existing = data.users.find((u) => u.phoneNumber === where.phoneNumber);
      if (existing) {
        if (update && Object.keys(update).length > 0) {
          if (update.name) existing.name = update.name;
          if (update.email) existing.email = update.email;
          existing.updatedAt = new Date().toISOString();
          saveLocalData(data);
        }
        return existing;
      }

      const newUser = {
        id: crypto.randomUUID(),
        phoneNumber: create.phoneNumber,
        name: create.name || null,
        email: create.email || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.users.push(newUser);
      saveLocalData(data);
      return newUser;
    },

    async findUnique({ where }) {
      const data = loadLocalData();
      return data.users.find((u) => u.id === where.id || (where.phoneNumber && u.phoneNumber === where.phoneNumber)) || null;
    },

    async update({ where, data: updateData }) {
      const data = loadLocalData();
      const user = data.users.find((u) => u.id === where.id || (where.phoneNumber && u.phoneNumber === where.phoneNumber));
      if (!user) throw new Error('User not found');
      if (updateData.name !== undefined) user.name = updateData.name;
      if (updateData.email !== undefined) user.email = updateData.email;
      user.updatedAt = new Date().toISOString();
      saveLocalData(data);
      return user;
    },
  },

  friend: {
    async create({ data: friendData }) {
      const data = loadLocalData();
      const newFriend = {
        id: crypto.randomUUID(),
        userId: friendData.userId,
        name: friendData.name.trim(),
        phone: friendData.phone?.trim() || null,
        email: friendData.email?.trim() || null,
        notes: friendData.notes?.trim() || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.friends.push(newFriend);
      saveLocalData(data);
      return newFriend;
    },

    async findMany({ where }) {
      const data = loadLocalData();
      return data.friends.filter((f) => {
        if (where?.userId && f.userId !== where.userId) return false;
        if (where?.name?.contains) {
          const q = where.name.contains.toLowerCase();
          if (!f.name.toLowerCase().includes(q)) return false;
        }
        return true;
      });
    },

    async findFirst({ where }) {
      const data = loadLocalData();
      return data.friends.find((f) => {
        if (where?.id && f.id !== where.id) return false;
        if (where?.userId && f.userId !== where.userId) return false;
        return true;
      }) || null;
    },

    async update({ where, data: updateData }) {
      const data = loadLocalData();
      const friend = data.friends.find((f) => f.id === where.id);
      if (!friend) throw new Error('Friend not found');

      if (updateData.name !== undefined) friend.name = updateData.name.trim();
      if (updateData.phone !== undefined) friend.phone = updateData.phone?.trim() || null;
      if (updateData.email !== undefined) friend.email = updateData.email?.trim() || null;
      if (updateData.notes !== undefined) friend.notes = updateData.notes?.trim() || null;
      friend.updatedAt = new Date().toISOString();

      saveLocalData(data);
      return friend;
    },

    async delete({ where }) {
      const data = loadLocalData();
      const index = data.friends.findIndex((f) => f.id === where.id);
      if (index === -1) throw new Error('Friend not found');
      const [deleted] = data.friends.splice(index, 1);
      saveLocalData(data);
      return deleted;
    },
  },

  loan: {
    async create({ data: loanData }) {
      const data = loadLocalData();
      const amountVal = loanData.amount.toString();
      const newLoan = {
        id: crypto.randomUUID(),
        userId: loanData.userId,
        friendId: loanData.friendId || null,
        friendName: loanData.friendName.trim(),
        type: loanData.type || 'LENT', // 'LENT' or 'BORROWED'
        amount: new Prisma.Decimal(amountVal),
        totalPaid: new Prisma.Decimal('0.00'),
        remainingBalance: new Prisma.Decimal(amountVal),
        loanDate: loanData.loanDate ? new Date(loanData.loanDate).toISOString() : new Date().toISOString(),
        dueDate: new Date(loanData.dueDate).toISOString(),
        interestRate: loanData.interestRate || 0,
        paymentSchedule: loanData.paymentSchedule || 'ONE_TIME',
        notes: loanData.notes || '',
        isRepaid: false,
        repaidAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.loans.push(newLoan);
      saveLocalData(data);
      return newLoan;
    },

    async findFirst({ where }) {
      const data = loadLocalData();
      const loan = data.loans.find((l) => {
        if (where?.id && l.id !== where.id) return false;
        if (where?.userId && l.userId !== where.userId) return false;
        return true;
      });
      if (!loan) return null;
      return {
        ...loan,
        amount: new Prisma.Decimal(loan.amount.toString()),
        totalPaid: new Prisma.Decimal(loan.totalPaid ? loan.totalPaid.toString() : '0.00'),
        remainingBalance: new Prisma.Decimal(loan.remainingBalance ? loan.remainingBalance.toString() : loan.amount.toString()),
      };
    },

    async findMany({ where, skip = 0, take = 50, orderBy, select }) {
      const data = loadLocalData();
      let filtered = data.loans.filter((l) => {
        if (where?.userId && l.userId !== where.userId) return false;
        if (where?.type && l.type !== where.type) return false;
        if (where?.friendId && l.friendId !== where.friendId) return false;
        if (where?.isRepaid !== undefined && l.isRepaid !== where.isRepaid) return false;
        if (where?.dueDate?.lt && !(new Date(l.dueDate) < new Date(where.dueDate.lt))) return false;
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

      const sliced = filtered.slice(skip, skip + take).map((l) => ({
        ...l,
        amount: new Prisma.Decimal(l.amount.toString()),
        totalPaid: new Prisma.Decimal(l.totalPaid ? l.totalPaid.toString() : '0.00'),
        remainingBalance: new Prisma.Decimal(l.remainingBalance ? l.remainingBalance.toString() : l.amount.toString()),
      }));

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
    },

    async count({ where }) {
      const data = loadLocalData();
      return data.loans.filter((l) => {
        if (where?.userId && l.userId !== where.userId) return false;
        if (where?.type && l.type !== where.type) return false;
        if (where?.friendId && l.friendId !== where.friendId) return false;
        if (where?.isRepaid !== undefined && l.isRepaid !== where.isRepaid) return false;
        if (where?.dueDate?.lt && !(new Date(l.dueDate) < new Date(where.dueDate.lt))) return false;
        if (where?.friendName?.contains) {
          const query = where.friendName.contains.toLowerCase();
          if (!l.friendName.toLowerCase().includes(query)) return false;
        }
        return true;
      }).length;
    },

    async update({ where, data: updateData }) {
      const data = loadLocalData();
      const loan = data.loans.find((l) => l.id === where.id);
      if (!loan) throw new Error('Loan not found');

      if (updateData.isRepaid !== undefined) loan.isRepaid = updateData.isRepaid;
      if (updateData.repaidAt !== undefined) {
        loan.repaidAt =
          updateData.repaidAt instanceof Date
            ? updateData.repaidAt.toISOString()
            : updateData.repaidAt;
      }
      if (updateData.totalPaid !== undefined) {
        loan.totalPaid = new Prisma.Decimal(updateData.totalPaid.toString());
      }
      if (updateData.remainingBalance !== undefined) {
        loan.remainingBalance = new Prisma.Decimal(updateData.remainingBalance.toString());
      }
      if (updateData.dueDate !== undefined) {
        loan.dueDate = new Date(updateData.dueDate).toISOString();
      }
      if (updateData.notes !== undefined) {
        loan.notes = updateData.notes;
      }

      loan.updatedAt = new Date().toISOString();
      saveLocalData(data);

      return {
        ...loan,
        amount: new Prisma.Decimal(loan.amount.toString()),
        totalPaid: new Prisma.Decimal(loan.totalPaid.toString()),
        remainingBalance: new Prisma.Decimal(loan.remainingBalance.toString()),
      };
    },
  },

  payment: {
    async create({ data: paymentData }) {
      const data = loadLocalData();
      const newPayment = {
        id: crypto.randomUUID(),
        userId: paymentData.userId,
        loanId: paymentData.loanId,
        amount: new Prisma.Decimal(paymentData.amount.toString()),
        paymentDate: new Date(paymentData.paymentDate).toISOString(),
        paymentMethod: paymentData.paymentMethod || 'UPI',
        reference: paymentData.reference?.trim() || null,
        receiptUrl: paymentData.receiptUrl?.trim() || null,
        notes: paymentData.notes?.trim() || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.payments.push(newPayment);
      saveLocalData(data);
      return newPayment;
    },

    async findFirst({ where }) {
      const data = loadLocalData();
      const p = data.payments.find((item) => {
        if (where?.id && item.id !== where.id) return false;
        if (where?.userId && item.userId !== where.userId) return false;
        if (where?.loanId && item.loanId !== where.loanId) return false;
        return true;
      });
      if (!p) return null;
      return {
        ...p,
        amount: new Prisma.Decimal(p.amount.toString()),
      };
    },

    async findMany({ where, orderBy }) {
      const data = loadLocalData();
      let filtered = data.payments.filter((p) => {
        if (where?.userId && p.userId !== where.userId) return false;
        if (where?.loanId && p.loanId !== where.loanId) return false;
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

      return filtered.map((p) => ({
        ...p,
        amount: new Prisma.Decimal(p.amount.toString()),
      }));
    },

    async update({ where, data: updateData }) {
      const data = loadLocalData();
      const payment = data.payments.find((p) => p.id === where.id);
      if (!payment) throw new Error('Payment not found');

      if (updateData.paymentMethod !== undefined) payment.paymentMethod = updateData.paymentMethod;
      if (updateData.reference !== undefined) payment.reference = updateData.reference;
      if (updateData.receiptUrl !== undefined) payment.receiptUrl = updateData.receiptUrl;
      if (updateData.notes !== undefined) payment.notes = updateData.notes;
      payment.updatedAt = new Date().toISOString();

      saveLocalData(data);
      return {
        ...payment,
        amount: new Prisma.Decimal(payment.amount.toString()),
      };
    },

    async delete({ where }) {
      const data = loadLocalData();
      const index = data.payments.findIndex((p) => p.id === where.id);
      if (index === -1) throw new Error('Payment not found');
      const [deleted] = data.payments.splice(index, 1);
      saveLocalData(data);
      return {
        ...deleted,
        amount: new Prisma.Decimal(deleted.amount.toString()),
      };
    },
  },

  reminder: {
    async create({ data: reminderData }) {
      const data = loadLocalData();
      const newReminder = {
        id: crypto.randomUUID(),
        userId: reminderData.userId,
        loanId: reminderData.loanId,
        reminderDateTime: new Date(reminderData.reminderDateTime).toISOString(),
        reminderType: reminderData.reminderType || 'DUE_DATE',
        channel: reminderData.channel || 'IN_APP',
        status: reminderData.status || 'PENDING',
        notes: reminderData.notes || null,
        sentAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.reminders.push(newReminder);
      saveLocalData(data);
      return newReminder;
    },

    async findMany({ where, orderBy }) {
      const data = loadLocalData();
      let filtered = data.reminders.filter((r) => {
        if (where?.userId && r.userId !== where.userId) return false;
        if (where?.loanId && r.loanId !== where.loanId) return false;
        if (where?.status && r.status !== where.status) return false;
        if (where?.reminderDateTime?.lte && !(new Date(r.reminderDateTime) <= new Date(where.reminderDateTime.lte))) return false;
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

      return filtered;
    },

    async findFirst({ where }) {
      const data = loadLocalData();
      return data.reminders.find((r) => {
        if (where?.id && r.id !== where.id) return false;
        if (where?.userId && r.userId !== where.userId) return false;
        return true;
      }) || null;
    },

    async update({ where, data: updateData }) {
      const data = loadLocalData();
      const reminder = data.reminders.find((r) => r.id === where.id);
      if (!reminder) throw new Error('Reminder not found');

      if (updateData.reminderDateTime !== undefined) reminder.reminderDateTime = new Date(updateData.reminderDateTime).toISOString();
      if (updateData.channel !== undefined) reminder.channel = updateData.channel;
      if (updateData.status !== undefined) reminder.status = updateData.status;
      if (updateData.sentAt !== undefined) reminder.sentAt = updateData.sentAt;
      if (updateData.notes !== undefined) reminder.notes = updateData.notes;
      reminder.updatedAt = new Date().toISOString();

      saveLocalData(data);
      return reminder;
    },

    async delete({ where }) {
      const data = loadLocalData();
      const index = data.reminders.findIndex((r) => r.id === where.id);
      if (index === -1) throw new Error('Reminder not found');
      const [deleted] = data.reminders.splice(index, 1);
      saveLocalData(data);
      return deleted;
    },
  },

  notification: {
    async create({ data: notifData }) {
      const data = loadLocalData();
      const newNotif = {
        id: crypto.randomUUID(),
        userId: notifData.userId,
        loanId: notifData.loanId || null,
        title: notifData.title,
        message: notifData.message,
        type: notifData.type || 'INFO',
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      data.notifications.push(newNotif);
      saveLocalData(data);
      return newNotif;
    },

    async findMany({ where, orderBy }) {
      const data = loadLocalData();
      let filtered = data.notifications.filter((n) => {
        if (where?.userId && n.userId !== where.userId) return false;
        if (where?.readAt === null && n.readAt !== null) return false;
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

      return filtered;
    },

    async findFirst({ where }) {
      const data = loadLocalData();
      return data.notifications.find((n) => {
        if (where?.id && n.id !== where.id) return false;
        if (where?.userId && n.userId !== where.userId) return false;
        return true;
      }) || null;
    },

    async update({ where, data: updateData }) {
      const data = loadLocalData();
      const notif = data.notifications.find((n) => n.id === where.id);
      if (!notif) throw new Error('Notification not found');

      if (updateData.readAt !== undefined) notif.readAt = updateData.readAt;
      saveLocalData(data);
      return notif;
    },

    async updateMany({ where, data: updateData }) {
      const data = loadLocalData();
      let count = 0;
      data.notifications.forEach((n) => {
        if (where?.userId && n.userId !== where.userId) return;
        if (where?.readAt === null && n.readAt !== null) return;
        if (updateData.readAt !== undefined) n.readAt = updateData.readAt;
        count++;
      });
      saveLocalData(data);
      return { count };
    },
  },

  async $disconnect() {
    if (isPostgresConnected) {
      await realPrisma.$disconnect();
    }
  },
};

const smartDb = new Proxy(realPrisma, {
  get(target, prop) {
    if (isPostgresConnected && target[prop]) {
      return target[prop];
    }
    if (prop in localStore) {
      return localStore[prop];
    }
    return target[prop];
  },
});

module.exports = smartDb;
