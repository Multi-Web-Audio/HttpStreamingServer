from django.urls import path
from django.urls.conf import include
from django.conf.urls import url
from rest_framework.routers import DefaultRouter

from StreamServerApp.views import videos, subtitles, tasks, update, accounts


router = DefaultRouter()
router.register(r'videos', videos.VideoViewSet, basename='videos')
router.register(r'series', videos.SeriesViewSet, basename='series')
router.register(r'movies', videos.MoviesViewSet, basename='movies')
router.register(r'subtitles', subtitles.SubtitleViewSet, basename='subtitles')


urlpatterns = [
    path('', videos.index, name='index'),
    url(r'^', include(router.urls)),
    url('^series/(?P<series>.+)/season/(?P<season>.+)/$', videos.SeriesSeaonViewSet.as_view()),
    url(r'^history/', accounts.History.as_view(), name='history'),
    url(r'^updatedb/', update.RestUpdate().as_view(), name='updatedb'),
    url(r'^tasks/(?P<task_id>.+)/$', tasks.Task.as_view(), name='task'),
    url(r'^rest-auth/', include('rest_auth.urls')),
    url(r'^rest-auth/registration/', include('rest_auth.registration.urls')),
    url(r'^sync_subtitles/(?P<video_id>.+)/(?P<subtitle_id>.+)/$', videos.request_sync_subtitles)
]

urlpatterns_internal = [
     url(r'^updatedb/', update.RestUpdate.as_view(), name='updatedb'),
]

