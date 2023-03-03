
import { ShaderMaterial } from 'three';
import Defaults from '../../utils/Defaults.js';

/**

Job:
- Host the materials of a given component.
- Update a component's materials clipping planes
- When materials attributes are updated, update the material

Knows:
- Its component materials
- Its component ancestors clipping planes

*/
export default function MaterialManager( Base = class {} ) {

	return class MaterialManager extends Base {

        getBackgroundUniforms() {

            let color, opacity;

            const texture = this.getBackgroundTexture();

            this.tSize.set(
                texture.image.width,
                texture.image.height
            );

            if ( texture.isDefault ) {

                color = this.getBackgroundColor();
                opacity = this.getBackgroundOpacity();

            } else {

                color = this.backgroundColor || Defaults.backgroundWhiteColor;

                opacity = ( !this.backgroundOpacity && this.backgroundOpacity !== 0 ) ?
                    Defaults.backgroundOpaqueOpacity :
                    this.backgroundOpacity;

            }

            const backgroundMapping = ( () => {
                switch ( this.getBackgroundSize() ) {
                    case 'stretch': return 0;
                    case 'contain': return 1;
                    case 'cover': return 2;
                }
            } )();

            return {
                texture,
                color,
                opacity,
                backgroundMapping,
                borderRadius: this.getBorderRadius(),
                borderWidth: this.getBorderWidth(),
                borderColor: this.getBorderColor(),
                borderOpacity: this.getBorderOpacity(),
                size: this.size,
                tSize: this.tSize
            }

        }

        /** Update existing backgroundMaterial uniforms */
        updateBackgroundMaterial() {

            if ( this.backgroundUniforms ) {
                const uniforms = this.getBackgroundUniforms();

                this.backgroundUniforms.u_texture.value = uniforms.texture;
                this.backgroundUniforms.u_color.value = uniforms.color;
                this.backgroundUniforms.u_opacity.value = uniforms.opacity;
                this.backgroundUniforms.u_backgroundMapping.value = uniforms.backgroundMapping;
                this.backgroundUniforms.u_size.value = uniforms.size;
                this.backgroundUniforms.u_tSize.value = uniforms.tSize;

                if (Array.isArray(uniforms.borderRadius)) {
                    this.backgroundUniforms.u_borderRadiusTopLeft.value = uniforms.borderRadius[0];
                    this.backgroundUniforms.u_borderRadiusTopRight.value = uniforms.borderRadius[1];
                    this.backgroundUniforms.u_borderRadiusBottomRight.value = uniforms.borderRadius[2];
                    this.backgroundUniforms.u_borderRadiusBottomLeft.value = uniforms.borderRadius[3];
                } else {
                    this.backgroundUniforms.u_borderRadiusTopLeft.value = uniforms.borderRadius;
                    this.backgroundUniforms.u_borderRadiusTopRight.value = uniforms.borderRadius;
                    this.backgroundUniforms.u_borderRadiusBottomRight.value = uniforms.borderRadius;
                    this.backgroundUniforms.u_borderRadiusBottomLeft.value = uniforms.borderRadius;
                }

                this.backgroundUniforms.u_borderWidth.value = uniforms.borderWidth;
                this.backgroundUniforms.u_borderColor.value = uniforms.borderColor;
                this.backgroundUniforms.u_borderOpacity.value = uniforms.borderOpacity;

            }

        }

        /** Update existing fontMaterial uniforms */
        updateTextMaterial() {

            if ( this.textUniforms ) {

                this.textUniforms.u_texture.value = this.getFontTexture();
                this.textUniforms.u_color.value = this.getFontColor();
                this.textUniforms.u_opacity.value = this.getFontOpacity();

            }

        }

        /**
         * Update a component's materials clipping planes.
         * Called every frame
         */
        updateClippingPlanes( value ) {

            const newClippingPlanes = value !== undefined ? value : this.getClippingPlanes();

            if ( JSON.stringify( newClippingPlanes ) !== JSON.stringify( this.clippingPlanes ) ) {

                this.clippingPlanes = newClippingPlanes;

                if ( this.fontMaterial ) this.fontMaterial.clippingPlanes = this.clippingPlanes;

                if ( this.backgroundMaterial ) this.backgroundMaterial.clippingPlanes = this.clippingPlanes;

            }

        }

        /** Called by Block, which needs the background material to create a mesh */
        getBackgroundMaterial() {

            const newUniforms = this.getBackgroundUniforms();

            if ( !this.backgroundMaterial || !this.backgroundUniforms ) {

                this.backgroundMaterial = this._makeBackgroundMaterial( newUniforms );

                return this.backgroundMaterial

            }

            let borderRadiusChanged;
            if (Array.isArray(newUniforms.borderRadius)) {
                borderRadiusChanged = (
                  newUniforms.borderRadius[0] !== this.backgroundUniforms.u_borderRadiusTopLeft.value ||
                  newUniforms.borderRadius[1] !== this.backgroundUniforms.u_borderRadiusTopRight.value ||
                  newUniforms.borderRadius[2] !== this.backgroundUniforms.u_borderRadiusBottomRight.value ||
                  newUniforms.borderRadius[3] !== this.backgroundUniforms.u_borderRadiusBottomLeft.value
                )
            } else {
                borderRadiusChanged = (
                  newUniforms.borderRadius !== this.backgroundUniforms.u_borderRadiusTopLeft.value ||
                  newUniforms.borderRadius !== this.backgroundUniforms.u_borderRadiusTopRight.value ||
                  newUniforms.borderRadius !== this.backgroundUniforms.u_borderRadiusBottomRight.value ||
                  newUniforms.borderRadius !== this.backgroundUniforms.u_borderRadiusBottomLeft.value
                )
            }

            if (
              newUniforms.texture !== this.backgroundUniforms.u_texture.value ||
              newUniforms.color !== this.backgroundUniforms.u_color.value ||
              newUniforms.opacity !== this.backgroundUniforms.u_opacity.value ||
              newUniforms.backgroundMapping !== this.backgroundUniforms.u_backgroundMapping.value ||
              borderRadiusChanged ||
              newUniforms.borderWidth !== this.backgroundUniforms.u_borderWidth.value ||
              newUniforms.borderColor !== this.backgroundUniforms.u_borderColor.value ||
              newUniforms.borderOpacity !== this.backgroundUniforms.u_borderOpacity.value ||
              newUniforms.size !== this.backgroundUniforms.u_size.value ||
              newUniforms.tSize !== this.backgroundUniforms.u_tSize.value
            ) {

                this.updateBackgroundMaterial();

            }

            return this.backgroundMaterial

        }

        /** Called by Text to get the font material */
        getFontMaterial() {

            const newUniforms = {
                'u_texture': this.getFontTexture(),
                'u_color': this.getFontColor(),
                'u_opacity': this.getFontOpacity()
            };

            if ( !this.fontMaterial || !this.textUniforms ) {

                this.fontMaterial = this._makeTextMaterial( newUniforms );

            } else if (
                newUniforms.u_texture !== this.textUniforms.u_texture.value ||
                newUniforms.u_color !== this.textUniforms.u_color.value ||
                newUniforms.u_opacity !== this.textUniforms.u_opacity.value
            ) {

                this.updateTextMaterial();

            }

            return this.fontMaterial

        }

        /** @private */
        _makeTextMaterial( materialOptions ) {

            this.textUniforms = {
                'u_texture': { value: materialOptions.u_texture },
                'u_color': { value: materialOptions.u_color },
                'u_opacity': { value: materialOptions.u_opacity }
            }

            return new ShaderMaterial({
                uniforms: this.textUniforms,
                transparent: true,
                clipping: true,
                vertexShader: textVertex,
                fragmentShader: textFragment,
                extensions: {
                    derivatives: true
                }
            })

        }

        /** @private */
        _makeBackgroundMaterial( materialOptions ) {

            this.backgroundUniforms = {
                'u_texture': { value: materialOptions.texture },
                'u_color': { value: materialOptions.color },
                'u_opacity': { value: materialOptions.opacity },
                'u_backgroundMapping': { value: materialOptions.backgroundMapping },
                'u_borderWidth': { value: materialOptions.borderWidth },
                'u_borderColor': { value: materialOptions.borderColor },
                'u_borderRadiusTopLeft': { value: 0 },
                'u_borderRadiusTopRight': { value: 0 },
                'u_borderRadiusBottomRight': { value: 0 },
                'u_borderRadiusBottomLeft': { value: 0 },
                'u_borderOpacity': { value: materialOptions.borderOpacity },
                'u_size': { value: materialOptions.size },
                'u_tSize': { value: materialOptions.tSize }
            };

            if (Array.isArray(materialOptions.borderRadius)) {
                this.backgroundUniforms['u_borderRadiusTopLeft'].values = materialOptions.borderRadius[0];
                this.backgroundUniforms['u_borderRadiusTopRight'].values = materialOptions.borderRadius[1];
                this.backgroundUniforms['u_borderRadiusBottomRight'].values = materialOptions.borderRadius[2];
                this.backgroundUniforms['u_borderRadiusBottomLeft'].values = materialOptions.borderRadius[3];
            } else {
                this.backgroundUniforms['u_borderRadiusTopLeft'].values = materialOptions.borderRadius;
                this.backgroundUniforms['u_borderRadiusTopRight'].values = materialOptions.borderRadius;
                this.backgroundUniforms['u_borderRadiusBottomRight'].values = materialOptions.borderRadius;
                this.backgroundUniforms['u_borderRadiusBottomLeft'].values = materialOptions.borderRadius;
            }

            return new ShaderMaterial({
                uniforms: this.backgroundUniforms,
                transparent: true,
                clipping: true,
                vertexShader: backgroundVertex,
                fragmentShader: backgroundFragment,
                extensions: {
                    derivatives: true
                }
            })

        }

	}

}

////////////////
// Text shaders
////////////////

const textVertex = `
	varying vec2 vUv;

	#include <clipping_planes_pars_vertex>

	void main() {

		vUv = uv;
		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
		gl_Position = projectionMatrix * mvPosition;
		gl_Position.z -= 0.00001;

		#include <clipping_planes_vertex>

	}
`;

//

const textFragment = `
	uniform sampler2D u_texture;
	uniform vec3 u_color;
	uniform float u_opacity;

	varying vec2 vUv;

	#include <clipping_planes_pars_fragment>

	float median(float r, float g, float b) {
		return max(min(r, g), min(max(r, g), b));
	}

	void main() {

		vec3 textureSample = texture2D( u_texture, vUv ).rgb;
		float sigDist = median( textureSample.r, textureSample.g, textureSample.b ) - 0.5;
		float alpha = clamp( sigDist / fwidth( sigDist ) + 0.5, 0.0, 1.0 );
		gl_FragColor = vec4( u_color, min( alpha, u_opacity ) );
	
		#include <clipping_planes_fragment>

	}
`;

//////////////////////
// Background shaders
//////////////////////

const backgroundVertex = `
	varying vec2 vUv;

	#include <clipping_planes_pars_vertex>

	void main() {

		vUv = uv;
		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
		gl_Position = projectionMatrix * mvPosition;

		#include <clipping_planes_vertex>

	}
`;

//

const backgroundFragment = `
	uniform sampler2D u_texture;
	uniform vec3 u_color;
	uniform float u_opacity;

    uniform float u_borderRadiusTopLeft;
    uniform float u_borderRadiusTopRight;
    uniform float u_borderRadiusBottomLeft;
    uniform float u_borderRadiusBottomRight;
    uniform float u_borderWidth;
    uniform vec3 u_borderColor;
    uniform float u_borderOpacity;
    uniform vec2 u_size;
    uniform vec2 u_tSize;
    uniform int u_backgroundMapping;

	varying vec2 vUv;

	#include <clipping_planes_pars_fragment>

    float getEdgeDist() {
        vec2 ndc = vec2( vUv.x * 2.0 - 1.0, vUv.y * 2.0 - 1.0 );
        vec2 planeSpaceCoord = vec2( u_size.x * 0.5 * ndc.x, u_size.y * 0.5 * ndc.y );
        vec2 corner = u_size * 0.5;
        vec2 offsetCorner = corner - abs( planeSpaceCoord );
        float innerRadDist = min( offsetCorner.x, offsetCorner.y ) * -1.0;
        if (vUv.x < 0.5 && vUv.y >= 0.5) {
            float roundedDist = length( max( abs( planeSpaceCoord ) - u_size * 0.5 + u_borderRadiusTopLeft, 0.0 ) ) - u_borderRadiusTopLeft;
            float s = step( innerRadDist * -1.0, u_borderRadiusTopLeft );
            return mix( innerRadDist, roundedDist, s );
        }
        if (vUv.x >= 0.5 && vUv.y >= 0.5) {
            float roundedDist = length( max( abs( planeSpaceCoord ) - u_size * 0.5 + u_borderRadiusTopRight, 0.0 ) ) - u_borderRadiusTopRight;
            float s = step( innerRadDist * -1.0, u_borderRadiusTopRight );
            return mix( innerRadDist, roundedDist, s );
        }
        if (vUv.x >= 0.5 && vUv.y < 0.5) {
            float roundedDist = length( max( abs( planeSpaceCoord ) - u_size * 0.5 + u_borderRadiusBottomRight, 0.0 ) ) - u_borderRadiusBottomRight;
            float s = step( innerRadDist * -1.0, u_borderRadiusBottomRight );
            return mix( innerRadDist, roundedDist, s );
        }
        if (vUv.x < 0.5 && vUv.y < 0.5) {
            float roundedDist = length( max( abs( planeSpaceCoord ) - u_size * 0.5 + u_borderRadiusBottomLeft, 0.0 ) ) - u_borderRadiusBottomLeft;
            float s = step( innerRadDist * -1.0, u_borderRadiusBottomLeft );
            return mix( innerRadDist, roundedDist, s );
        }
    }

    vec4 sampleTexture() {
        float textureRatio = u_tSize.x / u_tSize.y;
        float panelRatio = u_size.x / u_size.y;
        vec2 uv = vUv;
        if ( u_backgroundMapping == 1 ) { // contain
            if ( textureRatio < panelRatio ) { // repeat on X
                float newX = uv.x * ( panelRatio / textureRatio );
                newX += 0.5 - 0.5 * ( panelRatio / textureRatio );
                uv.x = newX;
            } else { // repeat on Y
                float newY = uv.y * ( textureRatio / panelRatio );
                newY += 0.5 - 0.5 * ( textureRatio / panelRatio );
                uv.y = newY;
            }
        } else if ( u_backgroundMapping == 2 ) { // cover
            if ( textureRatio < panelRatio ) { // stretch on Y
                float newY = uv.y * ( textureRatio / panelRatio );
                newY += 0.5 - 0.5 * ( textureRatio / panelRatio );
                uv.y = newY;
            } else { // stretch on X
                float newX = uv.x * ( panelRatio / textureRatio );
                newX += 0.5 - 0.5 * ( panelRatio / textureRatio );
                uv.x = newX;
            }
        }
        return texture2D( u_texture, uv ).rgba;
    }

	void main() {
        float edgeDist = getEdgeDist();
        if ( edgeDist > 0.0 ) discard;
		vec4 textureSample = sampleTexture();
        float blendedOpacity = u_opacity * textureSample.a;
        vec3 blendedColor = textureSample.rgb * u_color;
        if ( edgeDist * -1.0 < u_borderWidth ) {
        gl_FragColor = vec4( u_borderColor, u_borderOpacity );
        } else {
		gl_FragColor = vec4( blendedColor, blendedOpacity );
		}
		#include <clipping_planes_fragment>
	}
`;
