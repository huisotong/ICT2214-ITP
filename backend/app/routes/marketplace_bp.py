from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.db import db
from app.models.agent import Agent
from app.models.user_agent import UserAgent
from app.models.users import User
import uuid
import secrets

marketplace_bp = Blueprint('marketplace', __name__)

@marketplace_bp.route('/marketplace/agents', methods=['GET'])
@jwt_required()
def get_all_agents():
    """Get all public agents for the marketplace"""
    try:
        agents = Agent.query.filter_by(is_public=True).all()
        return jsonify({
            'success': True,
            'agents': [agent.to_dict() for agent in agents]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch agents: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/agents', methods=['POST'])
@jwt_required()
def create_agent():
    """Create a new agent"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Generate unique agent ID and share token
        agent_id = str(uuid.uuid4())
        share_token = secrets.token_urlsafe(32)
        
        agent = Agent(
            agentID=agent_id,
            name=data.get('name'),
            description=data.get('description', ''),
            system_prompt=data.get('system_prompt'),
            model=data.get('model', 'gpt-3.5-turbo'),
            temperature=data.get('temperature', 0.7),
            max_tokens=data.get('max_tokens', 1000),
            created_by=user_id,
            is_public=data.get('is_public', True),
            share_token=share_token
        )
        
        db.session.add(agent)
        
        # Add to user's agent list
        user_agent = UserAgent(
            userID=user_id,
            agentID=agent_id,
            is_owner=True
        )
        db.session.add(user_agent)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Agent created successfully',
            'agent': agent.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to create agent: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/agents/<agent_id>', methods=['GET'])
@jwt_required()
def get_agent(agent_id):
    """Get a specific agent by ID"""
    try:
        agent = Agent.query.filter_by(agentID=agent_id).first()
        if not agent:
            return jsonify({
                'success': False,
                'message': 'Agent not found'
            }), 404
            
        # Increment view count
        agent.view_count += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'agent': agent.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch agent: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/agents/<agent_id>', methods=['PUT'])
@jwt_required()
def update_agent(agent_id):
    """Update an agent (only by owner)"""
    try:
        user_id = get_jwt_identity()
        agent = Agent.query.filter_by(agentID=agent_id).first()
        
        if not agent:
            return jsonify({
                'success': False,
                'message': 'Agent not found'
            }), 404
            
        if agent.created_by != user_id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized: You can only update your own agents'
            }), 403
            
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            agent.name = data['name']
        if 'description' in data:
            agent.description = data['description']
        if 'system_prompt' in data:
            agent.system_prompt = data['system_prompt']
        if 'model' in data:
            agent.model = data['model']
        if 'temperature' in data:
            agent.temperature = data['temperature']
        if 'max_tokens' in data:
            agent.max_tokens = data['max_tokens']
        if 'is_public' in data:
            agent.is_public = data['is_public']
            
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Agent updated successfully',
            'agent': agent.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to update agent: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/agents/<agent_id>', methods=['DELETE'])
@jwt_required()
def delete_agent(agent_id):
    """Delete an agent (only by owner)"""
    try:
        user_id = get_jwt_identity()
        agent = Agent.query.filter_by(agentID=agent_id).first()
        
        if not agent:
            return jsonify({
                'success': False,
                'message': 'Agent not found'
            }), 404
            
        if agent.created_by != user_id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized: You can only delete your own agents'
            }), 403
            
        # Remove all user_agent relationships
        UserAgent.query.filter_by(agentID=agent_id).delete()
        
        # Delete the agent
        db.session.delete(agent)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Agent deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to delete agent: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/agents/share/<share_token>', methods=['GET'])
@jwt_required()
def get_agent_by_share_token(share_token):
    """Get an agent by share token and add it to user's collection"""
    try:
        user_id = get_jwt_identity()
        agent = Agent.query.filter_by(share_token=share_token).first()
        
        if not agent:
            return jsonify({
                'success': False,
                'message': 'Invalid share link'
            }), 404
            
        # Check if user already has this agent
        existing_user_agent = UserAgent.query.filter_by(
            userID=user_id, 
            agentID=agent.agentID
        ).first()
        
        if not existing_user_agent:
            # Add to user's collection
            user_agent = UserAgent(
                userID=user_id,
                agentID=agent.agentID,
                is_owner=False
            )
            db.session.add(user_agent)
            db.session.commit()
        
        return jsonify({
            'success': True,
            'agent': agent.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to access shared agent: {str(e)}'
        }), 500

@marketplace_bp.route('/marketplace/my-agents', methods=['GET'])
@jwt_required()
def get_my_agents():
    """Get all agents owned by the current user"""
    try:
        user_id = get_jwt_identity()
        user_agents = UserAgent.query.filter_by(userID=user_id).all()
        
        return jsonify({
            'success': True,
            'agents': [ua.to_dict() for ua in user_agents]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch user agents: {str(e)}'
        }), 500
