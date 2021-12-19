let http = require('http');
let https = require('https');
let fetch = require('node-fetch');

let config = require('./config.json');

http.createServer((req, res) => {
    if(req.url != config.whitelist.path && config.whitelist.enabled) {
        res.statusCode = 403;
        res.statusMessage = "Forbidden";
        return res.end();
    }

    req.on('data', (d) => {
        let string = "";
        string += d;
        console.log(string);

        let packet;
        try {
            packet = JSON.parse(d)
        } catch(ex) {
            console.error("JSON PARSING FAILED.");
            return;
        }
        let embed = {
            title: "",
            color: 0xFFFFFF,
            description: "",
            fields: [],
            footer: {
                text: ""
            }
        };

        if(!packet.domain == "build")
            embed.fields.push({ name: "Repository", value: packet.data.repo_key, inline: true }, { name: "Path", value: packet.data.repo_key, inline: true });

        if(packet.domain != "build")
            embed.color = 0x41BF47;
        switch(packet.domain) {
            case 'artifact': // Artifact webhook.
                embed.title = `Artifact has been ${packet.event_type}`;

                let source_repo_path;
                let target_repo_path;
                if(packet.event_type == "moved" || packet.event_type == "copied") {
                    source_repo_path = packet.data.source_repo_path;
                    target_repo_path = packet.data.target_repo_path;
                } else {
                    source_repo_path = "`None`";
                    target_repo_path = "`None`";
                }

                embed.description = `Artifact with name ${packet.data.name} \<${packet.data.size} bytes\> has been ${packet.event_type}.`;
                embed.fields.push({ name: "Source Repository Path", value: source_repo_path});
                embed.fields.push({ name: "Target Repository Path", value: target_repo_path, inline: true });
            break;
            case 'artifact_property':
                embed.title = `Artifact Property has been ${packet.event_type}`;
                embed.description = `Artifact's Properties were ${packet.event_type} to ${packet.data.name} \<${packet.data.size} bytes\>.`;

                packet.data.property_values.forEach((el, i) => {
                    embed.fields.push({ name: `Property ${i}`, value: el });
                });
            break;

            case 'docker':
                embed.color = 0x2496ED;
                embed.title = `Docker Tag has been ${packet.event_type}`;
                embed.description = `A Tag has been ${packet.event_type} to Docker File ${packet.data.name}'s \<${packet.data.size} bytes\> [Image: ${packet.data.image_name}].`;
                embed.fields.push({ name: 'Tag', value: packet.data.tag, inline: true });

                packet.data.platforms.forEach((el, i) => {
                    embed.fields.push({ name: `Platform ${i}: ${el.architecture}`, value: el.os});
                });
            break;

            case 'build':
                embed.title = `Build has been ${packet.event_type}`;
                embed.description = `Build with name of ${packet.data.build_name} has been ${packet.event_type} in ${packet.data.build_repo} repository.`;

                embed.fields.push({ name: `Build Number`, value: packet.data.build_number, inline: true }, { name: `Build Start Time`, value: packet.data.build_started, inline: true });
            break;
        }
        embed.footer.text = `Origin: ${packet.jpd_origin}`;
        console.log('Webhook request inbound!');

        config.webhooks.forEach(el => {
            const discordpacket = JSON.stringify({
                username: el.name,
                //avatar_url: "https://somedevfox.jfrog.io/ui/img/jfrog.8f770bff.svg",
                embeds: [embed]
            });
            console.log(discordpacket)
            
            fetch(el.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: discordpacket
            }).then(res => res.text())
            .then(data => {
                console.log(`Response from Discord: ${data}`);
            })
        })
        res.statusCode = 200;
        res.end();
    })
}).listen(config.port);