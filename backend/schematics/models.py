from django.db import models

class Building(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    floor = models.IntegerField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class Schematic(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='schematics')
    name = models.CharField(max_length=255)
    width = models.IntegerField(default=1000)
    height = models.IntegerField(default=800)
    background_color = models.CharField(max_length=7, default='#FFFFFF')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.building.name} - {self.name}"

class Wall(models.Model):
    schematic = models.ForeignKey(Schematic, on_delete=models.CASCADE, related_name='walls')
    start_x = models.FloatField()
    start_y = models.FloatField()
    end_x = models.FloatField()
    end_y = models.FloatField()
    thickness = models.FloatField(default=10)
    color = models.CharField(max_length=7, default='#000000')
    scale_x = models.FloatField(default=1)
    scale_y = models.FloatField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Wall in {self.schematic.name}"

class SchematicLock(models.Model):
    schematic = models.ForeignKey(Schematic, on_delete=models.CASCADE, related_name='schematic_locks')
    lock = models.OneToOneField(Lock, on_delete=models.CASCADE, related_name='schematic_placement')
    x = models.FloatField()
    y = models.FloatField()
    scale_x = models.FloatField(default=1)
    scale_y = models.FloatField(default=1)
    color = models.CharField(max_length=7, default='black')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.lock.name} on {self.schematic.name}"