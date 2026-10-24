const { FriendService } = require('../services/friend.service');
const { sendSuccess } = require('../utils/response');
const { UnauthorizedError } = require('../utils/errors');

class FriendController {
  static async list(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const friends = await FriendService.listFriends(req.user.id);
      sendSuccess(res, friends, 'Friends retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const friend = await FriendService.createFriend(req.user.id, req.body);
      sendSuccess(res, friend, 'Friend added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const friend = await FriendService.getFriendById(req.user.id, req.params.id);
      sendSuccess(res, friend, 'Friend details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const updated = await FriendService.updateFriend(req.user.id, req.params.id, req.body);
      sendSuccess(res, updated, 'Friend updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      await FriendService.deleteFriend(req.user.id, req.params.id);
      sendSuccess(res, null, 'Friend removed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getSummary(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const summary = await FriendService.getFriendSummary(req.user.id, req.params.id);
      sendSuccess(res, summary, 'Friend summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getStatement(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const statement = await FriendService.getFriendStatement(req.user.id, req.params.id);
      sendSuccess(res, statement, 'Friend statement retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { FriendController };
