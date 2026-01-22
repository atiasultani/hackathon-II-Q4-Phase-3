from fastapi import APIRouter, Depends, BackgroundTasks
from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime
import asyncio
import logging
from sqlalchemy.orm import Session
from ..models import User
from ..database import get_db
from ..services.animation_service import animation_service

router = APIRouter()

# Models for metrics
class DeviceInfo(BaseModel):
    browser: str
    os: str
    memory: Optional[int] = None
    cpu_cores: Optional[int] = None
    screen_resolution: Optional[str] = None
    user_agent: Optional[str] = None

class PerformanceMetrics(BaseModel):
    average_fps: float
    frame_drop_count: int
    animation_duration: float
    memory_usage_mb: Optional[float] = None
    cpu_usage_percent: Optional[float] = None
    network_latency_ms: Optional[float] = None

class AnimationPerformanceMetrics(BaseModel):
    device_info: DeviceInfo
    performance_metrics: PerformanceMetrics
    timestamp: str

class AnimationMetricsResponse(BaseModel):
    success: bool
    metrics_received: bool
    message: Optional[str] = None

class PerformanceSummary(BaseModel):
    avg_fps: float
    min_fps: float
    max_fps: float
    total_submissions: int
    time_period: str

# Store for performance metrics
performance_metrics_store: List[Dict] = []

@router.post("/animation/performance", response_model=AnimationMetricsResponse)
async def submit_performance_metrics(
    metrics: AnimationPerformanceMetrics,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Submit animation performance metrics from the frontend
    """
    try:
        # Store the metrics
        metric_entry = {
            "user_id": current_user.id,
            "device_info": metrics.device_info.dict(),
            "performance_metrics": metrics.performance_metrics.dict(),
            "timestamp": metrics.timestamp,
            "received_at": datetime.utcnow().isoformat()
        }

        performance_metrics_store.append(metric_entry)

        # Process metrics in background
        background_tasks.add_task(analyze_and_store_metrics, metric_entry)

        return AnimationMetricsResponse(
            success=True,
            metrics_received=True,
            message="Performance metrics received successfully"
        )
    except Exception as e:
        logging.error(f"Error submitting performance metrics: {e}")
        return AnimationMetricsResponse(
            success=False,
            metrics_received=False,
            message=f"Error submitting metrics: {str(e)}"
        )

async def analyze_and_store_metrics(metric_entry: Dict):
    """
    Analyze and store performance metrics in database
    """
    try:
        # In a real implementation, this would store to a database
        # For now, we'll just log the metrics
        avg_fps = metric_entry['performance_metrics']['average_fps']

        # Log metrics for monitoring
        logging.info(f"Performance Metrics - User: {metric_entry['user_id']}, "
                    f"Avg FPS: {avg_fps}, Frame Drops: {metric_entry['performance_metrics']['frame_drop_count']}")

        # Trigger alerts if performance is poor
        if avg_fps < 20:
            logging.warning(f"LOW FPS ALERT - User: {metric_entry['user_id']}, FPS: {avg_fps}")

            # Could trigger notifications to admin dashboard here
            await trigger_performance_notification(metric_entry)

    except Exception as e:
        logging.error(f"Error analyzing metrics: {e}")

async def trigger_performance_notification(metric_entry: Dict):
    """
    Trigger notification when performance metrics indicate issues
    """
    try:
        # This would typically send a notification to an admin dashboard or monitoring system
        avg_fps = metric_entry['performance_metrics']['average_fps']
        user_id = metric_entry['user_id']

        # For now, just log it
        logging.warning(f"Performance alert: Low FPS ({avg_fps}) reported by user {user_id}")

        # In a real system, this might:
        # - Send email to admins
        # - Post to Slack/Discord
        # - Update monitoring dashboard
        # - Trigger optimization routines
    except Exception as e:
        logging.error(f"Error triggering performance notification: {e}")

@router.get("/animation/performance/summary", response_model=PerformanceSummary)
async def get_performance_summary(
    hours: int = 24,
    current_user: User = Depends(get_current_user_admin)  # Admin access only
):
    """
    Get performance metrics summary (admin only)
    """
    try:
        # Filter metrics from the last 'hours' hours
        cutoff_time = datetime.utcnow().timestamp() - (hours * 3600)
        recent_metrics = [
            m for m in performance_metrics_store
            if datetime.fromisoformat(m['timestamp']).timestamp() > cutoff_time
        ]

        if not recent_metrics:
            return PerformanceSummary(
                avg_fps=0,
                min_fps=0,
                max_fps=0,
                total_submissions=0,
                time_period=f"last {hours} hours"
            )

        fps_values = [m['performance_metrics']['average_fps'] for m in recent_metrics]

        return PerformanceSummary(
            avg_fps=sum(fps_values) / len(fps_values),
            min_fps=min(fps_values),
            max_fps=max(fps_values),
            total_submissions=len(recent_metrics),
            time_period=f"last {hours} hours"
        )
    except Exception as e:
        logging.error(f"Error getting performance summary: {e}")
        raise

@router.get("/animation/performance/device-breakdown")
async def get_device_performance_breakdown(
    current_user: User = Depends(get_current_user_admin)  # Admin access only
):
    """
    Get performance metrics broken down by device characteristics
    """
    try:
        # Group metrics by device characteristics
        device_breakdown = {}

        for metric in performance_metrics_store:
            device_key = f"{metric['device_info']['browser']}_{metric['device_info'].get('os', 'unknown')}"

            if device_key not in device_breakdown:
                device_breakdown[device_key] = {
                    'fps_values': [],
                    'count': 0,
                    'avg_frame_drops': 0
                }

            device_breakdown[device_key]['fps_values'].append(
                metric['performance_metrics']['average_fps']
            )
            device_breakdown[device_key]['count'] += 1
            device_breakdown[device_key]['avg_frame_drops'] += metric['performance_metrics']['frame_drop_count']

        # Calculate averages
        for key in device_breakdown:
            fps_values = device_breakdown[key]['fps_values']
            device_breakdown[key]['avg_fps'] = sum(fps_values) / len(fps_values) if fps_values else 0
            device_breakdown[key]['avg_frame_drops'] /= device_breakdown[key]['count']

        return {
            "device_performance": device_breakdown,
            "total_devices_tracked": len(device_breakdown)
        }
    except Exception as e:
        logging.error(f"Error getting device breakdown: {e}")
        raise

@router.get("/animation/performance/alerts")
async def get_performance_alerts(
    current_user: User = Depends(get_current_user_admin)  # Admin access only
):
    """
    Get performance alerts (low FPS, high frame drops, etc.)
    """
    try:
        alerts = []

        for metric in performance_metrics_store:
            fps = metric['performance_metrics']['average_fps']
            frame_drops = metric['performance_metrics']['frame_drop_count']

            if fps < 20:
                alerts.append({
                    "type": "LOW_FPS",
                    "severity": "HIGH" if fps < 10 else "MEDIUM",
                    "user_id": metric['user_id'],
                    "fps": fps,
                    "timestamp": metric['timestamp']
                })

            if frame_drops > 50:
                alerts.append({
                    "type": "HIGH_FRAME_DROPS",
                    "severity": "HIGH" if frame_drops > 100 else "MEDIUM",
                    "user_id": metric['user_id'],
                    "frame_drops": frame_drops,
                    "timestamp": metric['timestamp']
                })

        return {
            "alerts": alerts,
            "total_alerts": len(alerts),
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logging.error(f"Error getting performance alerts: {e}")
        raise

@router.get("/animation/performance/trends")
async def get_performance_trends(
    hours: int = 24,
    current_user: User = Depends(get_current_user_admin)  # Admin access only
):
    """
    Get performance trends over time
    """
    try:
        import math

        # Group metrics by hour
        hourly_data = {}
        cutoff_time = datetime.utcnow().timestamp() - (hours * 3600)

        for metric in performance_metrics_store:
            metric_time = datetime.fromisoformat(metric['timestamp'])
            hour_key = metric_time.strftime("%Y-%m-%d %H:00")

            if datetime.fromisoformat(metric['timestamp']).timestamp() > cutoff_time:
                if hour_key not in hourly_data:
                    hourly_data[hour_key] = {'fps_values': [], 'count': 0}

                hourly_data[hour_key]['fps_values'].append(
                    metric['performance_metrics']['average_fps']
                )
                hourly_data[hour_key]['count'] += 1

        # Calculate hourly averages
        trends = []
        for hour, data in hourly_data.items():
            if data['fps_values']:
                avg_fps = sum(data['fps_values']) / len(data['fps_values'])
                trends.append({
                    "hour": hour,
                    "avg_fps": round(avg_fps, 2),
                    "sample_count": data['count']
                })

        # Sort by time
        trends.sort(key=lambda x: x['hour'])

        return {
            "trends": trends,
            "time_period": f"last {hours} hours",
            "data_points": len(trends)
        }
    except Exception as e:
        logging.error(f"Error getting performance trends: {e}")
        raise

# Dependency to get current user (would be implemented based on your auth system)
async def get_current_user():
    # Placeholder - implement based on your authentication system
    return User(id="placeholder_user_id", email="user@example.com")

# Admin user dependency
async def get_current_user_admin():
    # Placeholder - implement based on your authentication system
    # This should verify admin privileges
    user = await get_current_user()
    # Add admin check here in real implementation
    return user