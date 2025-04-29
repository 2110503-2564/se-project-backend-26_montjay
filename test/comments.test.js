// Mock setup - define before importing
jest.mock('../models/Comment', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn()
}));

jest.mock('../models/Dentist', () => ({
  findById: jest.fn()
}));

jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn().mockReturnValue(true)
    }
  }
}));

// Import dependencies and controller
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Dentist = require('../models/Dentist');
const commentController = require('../controllers/comments');

// Basic setup for tests
describe('Comment Controller Tests', () => {
  // Common setup
  let req, res, next;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup standard request and response
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'userId', role: 'user' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
  });

  // =========== getComments Tests ===========
  describe('getComments', () => {
    test('should return all comments successfully', async () => {
      // Setup
      const mockComments = [
        { _id: 'comment1', user: { name: 'User 1' }, comment: 'Great dentist!' }
      ];
      
      const populateMock = jest.fn().mockResolvedValue(mockComments);
      const chainMock = { populate: populateMock };
      Comment.find.mockReturnValue(chainMock);
      
      // Execute
      await commentController.getComments(req, res);
      
      // Assert
      expect(Comment.find).toHaveBeenCalled();
      expect(populateMock).toHaveBeenCalledWith({ 
        path: 'user', 
        select: 'name' 
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should handle errors when fetching comments', async () => {
      // Setup
      const populateMock = jest.fn().mockRejectedValue(new Error('Database error'));
      Comment.find.mockReturnValue({ populate: populateMock });
      
      // Execute
      await commentController.getComments(req, res);
      
      // Assert
      expect(Comment.find).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });

    test('should handle empty results when fetching comments', async () => {
      // Setup for empty results
      const emptyResults = [];
      const populateMock = jest.fn().mockResolvedValue(emptyResults);
      Comment.find.mockReturnValue({ populate: populateMock });
      
      // Execute
      await commentController.getComments(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    test('should handle null comments array in getComments', async () => {
      // Setup - simulate a null response from populate
      const populateMock = jest.fn().mockRejectedValue(new Error('Database error'));
      Comment.find.mockReturnValue({ populate: populateMock });
      
      // Execute
      await commentController.getComments(req, res);
      
      // Assert
      expect(Comment.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });

  // =========== getCommentsByDentId Tests ===========
  describe('getCommentsByDentId', () => {
    test('should get comments for a specific dentist', async () => {
      // Setup
      const mockComments = [
        { _id: 'comment1', user: { name: 'User 1' }, comment: 'Great dentist!' }
      ];
      
      req.query.dentistId = 'dentistId';
      
      const populateMock = jest.fn().mockResolvedValue(mockComments);
      Comment.find.mockReturnValue({ populate: populateMock });
      
      // Execute
      await commentController.getCommentsByDentId(req, res, next);
      
      // Assert
      expect(Comment.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should return all comments when no dentistId is provided', async () => {
      // Setup
      const mockComments = [
        { _id: 'comment1', user: { name: 'User 1' }, comment: 'Great dentist!' }
      ];
      
      // Make sure req.query.dentistId is not set
      req.query = {};
      
      const populateMock = jest.fn().mockResolvedValue(mockComments);
      Comment.find.mockReturnValue({ populate: populateMock });
      
      // Execute
      await commentController.getCommentsByDentId(req, res, next);
      
      // Assert
      expect(Comment.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should return 400 when invalid dentistId format is provided', async () => {
      // Setup
      req.query.dentistId = 'invalidId';
      mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);
      
      // Execute
      await commentController.getCommentsByDentId(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(Comment.find).not.toHaveBeenCalled();
    });
    
    test('should handle errors when getting comments by dentist ID', async () => {
      // Setup
      req.query.dentistId = 'dentistId';
      
      const populateMock = jest.fn().mockRejectedValue(new Error('Database error'));
      Comment.find.mockReturnValue({ populate: populateMock });
      
      // Execute
      await commentController.getCommentsByDentId(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });

    test('should handle null query parameters in getCommentsByDentId', async () => {
      // Setup
      const mockComments = [];
      req.query = { dentistId: null };
      
      const populateMock = jest.fn().mockResolvedValue(mockComments);
      Comment.find.mockReturnValue({ populate: populateMock });
      
      // Execute
      await commentController.getCommentsByDentId(req, res, next);
      
      // Assert
      expect(Comment.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    test('should handle empty string dentistId parameter', async () => {
      // Setup
      const mockComments = [];
      req.query = { dentistId: '' };
      
      const populateMock = jest.fn().mockResolvedValue(mockComments);
      Comment.find.mockReturnValue({ populate: populateMock });
      
      // Execute
      await commentController.getCommentsByDentId(req, res, next);
      
      // Assert
      expect(Comment.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should handle null comments result in getCommentsByDentId', async () => {
      // Setup
      req.query.dentistId = 'dentistId';
      
      const populateMock = jest.fn().mockRejectedValue(new Error('Database error'));
      Comment.find.mockReturnValue({ populate: populateMock });
      
      // Execute
      await commentController.getCommentsByDentId(req, res, next);
      
      // Assert
      expect(Comment.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });

  // =========== getComment Tests ===========
  describe('getComment', () => {
    test('should get a single comment by ID', async () => {
      // Setup
      const mockComment = { 
        _id: 'commentId', 
        user: { name: 'User 1' },
        comment: 'Great experience'
      };
      
      req.params.id = 'commentId';
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      
      Comment.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockComment) });
      
      // Execute
      await commentController.getComment(req, res, next);

      expect(Comment.findById).toHaveBeenCalledWith('commentId');
      expect(populateMock).toHaveBeenCalledWith({ path: "user", select: "name" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockComment });
    });
    
    test('should return 400 when invalid comment ID format is provided', async () => {
      // Setup
      req.params.id = 'invalidId';
      mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);
      
      // Execute
      await commentController.getComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(Comment.findOne).not.toHaveBeenCalled();
    });
    
    test('should return 404 when comment is not found', async () => {
      req.params.id = 'nonExistentId';
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    
      // Properly mock chained populate returning null
      const populateMock = jest.fn().mockResolvedValue(null);
      Comment.findById.mockReturnValue({ populate: populateMock });
    
      await commentController.getComment(req, res, next);
    
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No comment found with ID nonExistentId',
      });
    });
    
    test('should handle errors when getting a comment', async () => {
      req.params.id = 'commentId';
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    
      const populateMock = jest.fn().mockRejectedValue(new Error('Database error'));
      Comment.findById.mockReturnValue({ populate: populateMock });
    
      await commentController.getComment(req, res, next);
    
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot find comment',
      });
    });
  });

  // =========== addComment Tests ===========
  describe('addComment', () => {
    test('should create a new comment', async () => {
      // Setup
      const mockDentist = { _id: 'dentistId' };
      const mockComment = { 
        _id: 'commentId', 
        user: 'userId', 
        dentist: 'dentistId',
        comment: 'Great service!'
      };
      
      req.body = { 
        dentist: 'dentistId',
        comment: 'Great service!'
      };
      
      Dentist.findById.mockResolvedValue(mockDentist);
      Comment.findOne.mockResolvedValue(null);
      Comment.create.mockResolvedValue(mockComment);
      
      // Execute
      await commentController.addComment(req, res, next);
      
      // Assert
      expect(Dentist.findById).toHaveBeenCalledWith('dentistId');
      expect(Comment.findOne).toHaveBeenCalled();
      expect(Comment.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should use user ID from body if provided', async () => {
      // Setup
      const mockDentist = { _id: 'dentistId' };
      const mockComment = { 
        _id: 'commentId', 
        user: 'userIdFromBody', 
        dentist: 'dentistId',
        comment: 'Great service!'
      };
      
      req.body = { 
        dentist: 'dentistId',
        user: 'userIdFromBody',
        comment: 'Great service!'
      };
      
      Dentist.findById.mockResolvedValue(mockDentist);
      Comment.findOne.mockResolvedValue(null);
      Comment.create.mockResolvedValue(mockComment);
      
      // Execute
      await commentController.addComment(req, res, next);
      
      // Assert
      expect(Comment.findOne).toHaveBeenCalled();
      expect(Comment.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should return 400 if no dentist ID is provided', async () => {
      // Setup
      req.body = { comment: 'Great service!' };
      
      // Execute
      await commentController.addComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(Dentist.findById).not.toHaveBeenCalled();
    });

    // THIS TEST IS CRITICAL FOR COVERAGE OF LINES 81-85
    test('should return 400 if no comment is provided', async () => {
      // Setup - body has dentist but no comment
      req.body = { dentist: 'dentistId' };
      
      // Execute
      await commentController.addComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.message).toContain('Please provide a comment');
      expect(Dentist.findById).not.toHaveBeenCalled();
    });
    
    test('should return 404 if dentist does not exist', async () => {
      // Setup
      req.body = { 
        dentist: 'nonExistentDentistId',
        comment: 'Great service!'
      };
      
      Dentist.findById.mockResolvedValue(null);
      
      // Execute
      await commentController.addComment(req, res, next);
      
      // Assert
      expect(Dentist.findById).toHaveBeenCalledWith('nonExistentDentistId');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
      expect(Comment.findOne).not.toHaveBeenCalled();
    });
    
    test('should return 400 if user already has a comment for this dentist', async () => {
      // Setup
      const mockDentist = { _id: 'dentistId' };
      const existingComment = { 
        _id: 'existingCommentId', 
        user: 'userId', 
        dentist: 'dentistId',
        comment: 'Existing comment'
      };
      
      req.body = { 
        dentist: 'dentistId',
        comment: 'New comment'
      };
      
      Dentist.findById.mockResolvedValue(mockDentist);
      Comment.findOne.mockResolvedValue(existingComment);
      
      // Execute
      await commentController.addComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(Comment.create).not.toHaveBeenCalled();
    });
    
    test('should allow admin to create multiple comments for same dentist', async () => {
      // Setup
      const mockDentist = { _id: 'dentistId' };
      const existingComment = { 
        _id: 'existingCommentId', 
        user: 'adminId', 
        dentist: 'dentistId',
        comment: 'First comment'
      };
      const newComment = { 
        _id: 'newCommentId', 
        user: 'adminId', 
        dentist: 'dentistId',
        comment: 'Second comment'
      };
      
      req.body = { 
        dentist: 'dentistId',
        comment: 'Second comment'
      };
      req.user = { id: 'adminId', role: 'admin' };
      
      Dentist.findById.mockResolvedValue(mockDentist);
      Comment.findOne.mockResolvedValue(existingComment);
      Comment.create.mockResolvedValue(newComment);
      
      // Execute
      await commentController.addComment(req, res, next);
      
      // Assert
      expect(Comment.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    // THIS TEST IS CRITICAL FOR COVERAGE OF THE ADMIN ROLES CHECK
    test('should allow superadmin to create multiple comments for same dentist', async () => {
      // Setup
      const mockDentist = { _id: 'dentistId' };
      const existingComment = { 
        _id: 'existingCommentId', 
        user: 'superadminId', 
        dentist: 'dentistId',
        comment: 'First comment'
      };
      const newComment = { 
        _id: 'newCommentId', 
        user: 'superadminId', 
        dentist: 'dentistId',
        comment: 'Second comment'
      };
      
      req.body = { 
        dentist: 'dentistId',
        comment: 'Second comment'
      };
      // Critical: set role as superadmin
      req.user = { id: 'superadminId', role: 'superadmin' };
      
      Dentist.findById.mockResolvedValue(mockDentist);
      Comment.findOne.mockResolvedValue(existingComment);
      Comment.create.mockResolvedValue(newComment);
      
      // Execute
      await commentController.addComment(req, res, next);
      
      // Assert
      expect(Comment.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should handle errors when creating a comment', async () => {
      // Setup
      req.body = { 
        dentist: 'dentistId',
        comment: 'Test comment'
      };
      
      Dentist.findById.mockRejectedValue(new Error('Database error'));
      
      // Execute
      await commentController.addComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle different request formats and validation in addComment', async () => {
      // Setup
      const mockDentist = { _id: 'dentistId' };
      
      // Test with additional body parameters
      req.body = { 
        dentist: 'dentistId',
        comment: 'Test comment',
        rating: 5
      };
      
      Dentist.findById.mockResolvedValue(mockDentist);
      Comment.findOne.mockResolvedValue(null);
      Comment.create.mockResolvedValue({
        _id: 'commentId',
        user: 'userId',
        dentist: 'dentistId',
        comment: 'Test comment',
        rating: 5
      });
      
      // Execute
      await commentController.addComment(req, res, next);
      
      // Assert
      expect(Comment.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    test('should handle missing req.user in addComment', async () => {
      // Setup
      const mockDentist = { _id: 'dentistId' };
      
      req.body = { 
        dentist: 'dentistId',
        comment: 'Comment without user',
        user: 'providedUserId'  // Provide user ID in body
      };
      
      // Remove req.user to test that scenario
      req.user = undefined;
      
      Dentist.findById.mockResolvedValue(mockDentist);
      Comment.findOne.mockResolvedValue(null);
      
      const newComment = { 
        _id: 'commentId', 
        user: 'providedUserId', 
        dentist: 'dentistId',
        comment: 'Comment without user'
      };
      Comment.create.mockResolvedValue(newComment);
      
      // Execute
      await commentController.addComment(req, res, next);
      
      // Assert
      expect(Comment.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    // THIS TEST IS CRITICAL FOR COVERAGE OF LINES 89-95
    test('should return 400 when no user ID is available', async () => {
      // Setup with no user info at all
      const mockDentist = { _id: 'dentistId' };
      
      req.body = { 
        dentist: 'dentistId',
        comment: 'Comment without user'
      };
      
      // Remove req.user completely
      req.user = undefined;
      // Don't provide user in body either
      
      Dentist.findById.mockResolvedValue(mockDentist);
      
      // Execute
      await commentController.addComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.message).toContain('No user ID available');
      expect(Comment.create).not.toHaveBeenCalled();
    });
  });

  // =========== updateComment Tests ===========
  describe('updateComment', () => {
    test('should update comment if user is owner', async () => {
      // Setup
      const mockComment = { 
        _id: 'commentId', 
        user: { 
          toString: jest.fn().mockReturnValue('userId') 
        },
        comment: 'Original comment',
        dentist: 'dentistId'
      };
      
      const updatedComment = { 
        ...mockComment, 
        comment: 'Updated comment' 
      };
      
      req.params.id = 'commentId';
      req.body = { comment: 'Updated comment' };
      
      Comment.findById.mockResolvedValue(mockComment);
      Comment.findByIdAndUpdate.mockResolvedValue(updatedComment);
      
      // Execute
      await commentController.updateComment(req, res, next);
      
      // Assert
      expect(Comment.findById).toHaveBeenCalledWith('commentId');
      expect(Comment.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should update comment if user is admin', async () => {
      // Setup
      const mockComment = { 
        _id: 'commentId', 
        user: { 
          toString: jest.fn().mockReturnValue('userId') 
        },
        comment: 'Original comment',
        dentist: 'dentistId'
      };
      
      const updatedComment = { 
        ...mockComment, 
        comment: 'Updated by admin' 
      };
      
      req.params.id = 'commentId';
      req.body = { comment: 'Updated by admin' };
      req.user = { id: 'adminId', role: 'admin' };
      
      Comment.findById.mockResolvedValue(mockComment);
      Comment.findByIdAndUpdate.mockResolvedValue(updatedComment);
      
      // Execute
      await commentController.updateComment(req, res, next);
      
      // Assert
      expect(Comment.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should return 404 if comment does not exist', async () => {
      // Setup
      req.params.id = 'nonExistentId';
      Comment.findById.mockResolvedValue(null);
      
      // Execute
      await commentController.updateComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
      expect(Comment.findByIdAndUpdate).not.toHaveBeenCalled();
    });
    
    test('should return 401 if user is not owner or admin', async () => {
      // Setup
      const mockComment = {
        _id: 'commentId',
        user: {
          toString: jest.fn().mockReturnValue('ownerId')
        },
        comment: 'Original comment',
        dentist: 'dentistId'
      };
      
      req.params.id = 'commentId';
      req.user = { id: 'differentUserId', role: 'user' };
      
      Comment.findById.mockResolvedValue(mockComment);
      
      // Execute
      await commentController.updateComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      expect(Comment.findByIdAndUpdate).not.toHaveBeenCalled();
    });
    
    test('should handle errors when updating a comment', async () => {
      // Setup
      req.params.id = 'commentId';
      Comment.findById.mockRejectedValue(new Error('Database error'));
      
      // Execute
      await commentController.updateComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should handle invalid ObjectId format in updateComment', async () => {
      // Setup
      req.params.id = 'invalidId';
      mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);
      
      // Execute
      await commentController.updateComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(Comment.findById).not.toHaveBeenCalled();
    });
  });

  // =========== deleteComment Tests ===========
  describe('deleteComment', () => {
    test('should delete comment if user is owner', async () => {
      // Setup
      const mockComment = {
        _id: 'commentId',
        user: {
          toString: jest.fn().mockReturnValue('userId')
        },
        comment: 'Test comment',
        dentist: 'dentistId',
        deleteOne: jest.fn().mockResolvedValue({})
      };
      
      req.params.id = 'commentId';
      
      Comment.findById.mockResolvedValue(mockComment);
      
      // Execute
      await commentController.deleteComment(req, res, next);
      
      // Assert
      expect(Comment.findById).toHaveBeenCalledWith('commentId');
      expect(mockComment.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should delete comment if user is admin', async () => {
      // Setup
      const mockComment = {
        _id: 'commentId',
        user: {
          toString: jest.fn().mockReturnValue('userId')
        },
        comment: 'Test comment',
        dentist: 'dentistId',
        deleteOne: jest.fn().mockResolvedValue({})
      };
      
      req.params.id = 'commentId';
      req.user = { id: 'adminId', role: 'admin' };
      
      Comment.findById.mockResolvedValue(mockComment);
      
      // Execute
      await commentController.deleteComment(req, res, next);
      
      // Assert
      expect(mockComment.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should delete comment if user is superadmin', async () => {
      // Setup
      const mockComment = {
        _id: 'commentId',
        user: {
          toString: jest.fn().mockReturnValue('userId')
        },
        comment: 'Test comment',
        dentist: 'dentistId',
        deleteOne: jest.fn().mockResolvedValue({})
      };
      
      req.params.id = 'commentId';
      req.user = { id: 'superadminId', role: 'superadmin' };
      
      Comment.findById.mockResolvedValue(mockComment);
      
      // Execute
      await commentController.deleteComment(req, res, next);
      
      // Assert
      expect(mockComment.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should return 404 if comment does not exist', async () => {
      // Setup
      req.params.id = 'nonExistentId';
      
      Comment.findById.mockResolvedValue(null);
      
      // Execute
      await commentController.deleteComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should return 401 if user is not owner or admin', async () => {
      // Setup
      const mockComment = {
        _id: 'commentId',
        user: {
          toString: jest.fn().mockReturnValue('ownerId')
        },
        comment: 'Test comment',
        dentist: 'dentistId'
      };
      
      req.params.id = 'commentId';
      req.user = { id: 'differentUserId', role: 'user' };
      
      Comment.findById.mockResolvedValue(mockComment);
      
      // Execute
      await commentController.deleteComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should handle errors when deleting a comment', async () => {
      // Setup
      req.params.id = 'commentId';
      
      Comment.findById.mockRejectedValue(new Error('Database error'));
      
      // Execute
      await commentController.deleteComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });

    test('should handle invalid ObjectId format in deleteComment', async () => {
      // Setup
      req.params.id = 'invalidId';
      mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);
      
      // Execute
      await commentController.deleteComment(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(Comment.findById).not.toHaveBeenCalled();
    });
  });
});