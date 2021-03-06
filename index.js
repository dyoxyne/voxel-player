var skin = require('minecraft-skin');

module.exports = function (game) {
    var mountPoint;
    var possessed;
    
    return function (img, skinOpts) {
        if (!skinOpts) {
          skinOpts = {};
        }
        skinOpts.scale = skinOpts.scale || new game.THREE.Vector3(0.04, 0.04, 0.04);
        var playerSkin = skin(game.THREE, img, skinOpts);
        var player = playerSkin.mesh;
        var physics = game.makePhysical(player);
        physics.playerSkin = playerSkin;
        
        player.position.set(0, 562, -20);
        game.scene.add(player);
        game.addItem(physics);
        
        physics.yaw = player;
        physics.pitch = player.head;
        physics.subjectTo(game.gravity);
        physics.blocksCreation = true;
        
        game.control(physics);
        
        const DT_CHECK_CAMERA_OUTSIDE = 33,
              MAX_CAMERA_OUTSIDE_POSITION_Z = player.cameraOutside.position.z,
              THRESHOLD_CAMERA_OUTSIDE_POSITION_Z = 5;
        var accumulatedDtCameraOutside = 0;

        game.on('tick', function (delta) {
            if (possessed == player.cameraOutside) {
                accumulatedDtCameraOutside += delta;
                if (accumulatedDtCameraOutside > DT_CHECK_CAMERA_OUTSIDE) {  
                    var playerPosition = game.playerPosition();
                    var playerHeight = physics.dimensions[1];
                    playerPosition[1] += Math.floor(playerHeight);

                    var cameraOutside = player.cameraOutside;
                    var raycastDirection = scaleVector(game.cameraVector(), -1);
                    var raycast = game.raycastVoxels(playerPosition, raycastDirection, cameraOutside.position.z * skinOpts.scale.z + 2);
                    if (raycast) {
                        var distance = distanceVectors(raycast.position, playerPosition);
                        var cameraPositionZDesired = (distance - 1) / skinOpts.scale.z;
                        cameraOutside.position.z = Math.min(cameraPositionZDesired, MAX_CAMERA_OUTSIDE_POSITION_Z);
                        if (cameraOutside.position.z <= THRESHOLD_CAMERA_OUTSIDE_POSITION_Z) {
                            cameraOutside.position.z = 0;
                        }
                    } else {
                        cameraOutside.position.z = MAX_CAMERA_OUTSIDE_POSITION_Z;
                    }
                    accumulatedDtCameraOutside = 0;
                }
            }
        });

        physics.move = function (x, y, z) {
            var xyz = parseXYZ(x, y, z);
            physics.yaw.position.x += xyz.x;
            physics.yaw.position.y += xyz.y;
            physics.yaw.position.z += xyz.z;
        };
        
        physics.moveTo = function (x, y, z) {
            var xyz = parseXYZ(x, y, z);
            physics.yaw.position.x = xyz.x;
            physics.yaw.position.y = xyz.y;
            physics.yaw.position.z = xyz.z;
        };
        
        var pov = 1;
        physics.pov = function (type) {
            if (type === 'first' || type === 1) {
                pov = 1;
            }
            else if (type === 'third' || type === 3) {
                pov = 3;
            }
            physics.possess();
        };
        
        physics.toggle = function () {
            physics.pov(pov === 1 ? 3 : 1);
        };
        
        physics.possess = function () {
            if (possessed) possessed.remove(game.camera);
            var key = pov === 1 ? 'cameraInside' : 'cameraOutside';
            player[key].add(game.camera);
            possessed = player[key];
        };
        
        physics.position = physics.yaw.position;
        
        return physics;
    }
};

function parseXYZ (x, y, z) {
    if (typeof x === 'object' && Array.isArray(x)) {
        return { x: x[0], y: x[1], z: x[2] };
    }
    else if (typeof x === 'object') {
        return { x: x.x || 0, y: x.y || 0, z: x.z || 0 };
    }
    return { x: Number(x), y: Number(y), z: Number(z) };
}

function distanceVectors (a, b) {
    var x = (a[0] - b[0]) * (a[0] - b[0]);
    var y = (a[1] - b[1]) * (a[1] - b[1]);
    var z = (a[2] - b[2]) * (a[2] - b[2]);
    return Math.sqrt(x + y + z);
}

function scaleVector (a, k) {
    var result = [];
    result[0] = a[0] * k;
    result[1] = a[1] * k;
    result[2] = a[2] * k;
    return result;
}
