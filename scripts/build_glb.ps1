# Re-export all Blender memory-palace scenes to models/<id>.glb.
# Requires blender.exe on PATH or at the default install location.

$ErrorActionPreference = "Stop"

$blender = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
if (-not (Test-Path $blender)) {
    $cmd = Get-Command blender -ErrorAction SilentlyContinue
    if ($cmd) { $blender = $cmd.Source } else { throw "blender.exe not found" }
}

$repo = Split-Path $PSScriptRoot -Parent
$src  = "C:\Users\ASUS\Desktop\Loc\blender\blender_models"
$script = Join-Path $PSScriptRoot "build_glb.py"

$map = @{
    "chinatown-street" = "chinatown_street.blend"
    "coffee-shop"      = "CoffeeShop.blend"
    "portal-island"    = "PortalIsland.blend"
    "chroniclers-athenaeum" = "ChroniclersAthenaeum.blend"
    "the-white-house"  = "TheWhiteHouse.blend"
    "writing-room"     = "PhongVietLachTacGia.blend"
    "time-machine"     = "TimeMachineTimeline.blend"
    "civil-war-map"    = "CivilWarMap.blend"
    "solar-system"     = "SolarSystem.blend"
    "india-history"    = "IndiaHistory.blend"
    "world-war-2"      = "WorldWarII.blend"
    "war-museum"       = "WarMuseum.blend"
    "pin-factory"      = "PinFactory.blend"
    "nobel-hall"       = "NobelHall.blend"
    "macro-hydraulic-hall" = "HydraulicHall.blend"
    "seaside-bungalow" = "SeasideBungalow.blend"
    "sky-loft"         = "SkyLoft.blend"
    "cfa-level-1"      = "CFAFinancialDistrict.blend"
    "grab-workplace"   = "GrabCourtyard.blend"
    "misty-valley"     = "LOTR_MistyValley.blend"
    "hutong-corner"    = "HutongCorner.blend"
    "meditation-ledge" = "MeditationLedge.blend"
}

foreach ($id in $map.Keys) {
    $blend = Join-Path $src $map[$id]
    Write-Host "== $id  <-  $($map[$id])"
    & $blender -b $blend -P $script -- $id
    if ($LASTEXITCODE -ne 0) { throw "export failed for $id" }
}
