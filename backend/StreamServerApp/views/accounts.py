import traceback
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth.models import User
from rest_framework.pagination import LimitOffsetPagination

from StreamServerApp.serializers.videos import VideoListSerializer
from StreamServerApp.models import Video, UserVideoHistory
from rest_framework import permissions
import logging 
logger = logging.getLogger("root")


class History(APIView, LimitOffsetPagination):
    """
    Get, create and update user history
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_history(self, request, user):
        queryset = Video.objects.select_related('movie', 'series').filter(history=user).order_by('-uservideohistory__updated_at')
        results = self.paginate_queryset(queryset, request, view=self)
        serializer = VideoListSerializer(results, many=True, context={"request": self.request})
        return self.get_paginated_response(serializer.data)

    def get(self, request):
        try:
            user = request.user
            return self.get_history(request, user)

        except Exception as ex:
            logger.exception(ex)
            return Response({}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def post(self, request):
        try:
            video_id = request.data.get('body').get('video-id')
            time = request.data.get('body').get('video-time', 0)
            user = request.user
            video = Video.objects.get(id=video_id)

            # For series we only keep one video history
            if video.series:
                UserVideoHistory.objects.filter(user=user, video__series=video.series).delete()
            
            # We still get or create here because there can be existing movie histories
            history, created = UserVideoHistory.objects.get_or_create(
                user=user,
                video=video,
                defaults={'time': time},
            )

            # We update the time when recieving new history for an existing history
            if not created:
                history.time = time
                history.save()

            # We send the history back to the client
            return self.get_history(request, user)

        except Exception as ex:
            logger.exception(ex)
            return Response({}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
