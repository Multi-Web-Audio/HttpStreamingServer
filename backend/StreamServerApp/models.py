from django.db import models

class Video(models.Model):
    name = models.CharField(max_length=200)
    video_codec = models.CharField(max_length=100, default="")
    height = models.IntegerField(default=0)
    width = models.IntegerField(default=0)
    audio_codec = models.CharField(max_length=100, default="")
    metadata = models.CharField(max_length=100, default="")
    video_url = models.CharField(max_length=300, default="")
    thumbnail = models.CharField(max_length=300, default="")


class Folder(models.Model):
    path = models.CharField(max_length=300)
    videos = models.ManyToManyField(Video)
