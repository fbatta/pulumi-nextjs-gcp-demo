import * as pulumi from "@pulumi/pulumi"
import * as docker from "@pulumi/docker"
import * as gcp from "@pulumi/gcp"

const location = gcp.config.region!!

const dockerImageName = "pulumi-nextjs-gcp-demo"
const dockerImage = new docker.Image(dockerImageName, {
    imageName: pulumi.interpolate`gcr.io/${gcp.config.project}/${dockerImageName}:v1.0.0`,
    build: {
        dockerfile: "./app/docker/Dockerfile",
        context: "./app"
    }
})

const nextjsService = new gcp.cloudrun.Service("nextjs", {
    location: gcp.config.region!!,
    template: {
        spec: {
            containers: [{
                image: dockerImage.imageName,
                ports: [{
                    containerPort: 3000
                }]
            }],
            containerConcurrency: 1
        }
    }
})

const iamNextjs = new gcp.cloudrun.IamMember("nextjs-unrestricted", {
    service: nextjsService.name,
    location: gcp.config.region!!,
    role: "roles/run.invoker",
    member: "allUsers"
})

export const url = nextjsService.statuses[0].url