# Generated by Django 4.2 on 2023-10-22 16:33

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0002_remove_userinfo_hobby_remove_userinfo_major_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='MajorInfo',
        ),
    ]
