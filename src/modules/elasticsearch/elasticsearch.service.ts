import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly indexPrefix: string;

  constructor(
    private readonly elasticsearchService: NestElasticsearchService,
    private readonly configService: ConfigService,
  ) {
    this.indexPrefix =
      this.configService.get('elasticsearch.indexPrefix') || 'ecommerce_';
  }

  async createIndex(indexName: string, settings?: any, mappings?: any) {
    const fullIndexName = `${this.indexPrefix}${indexName}`;

    try {
      const indexExists = await this.elasticsearchService.indices.exists({
        index: fullIndexName,
      });

      if (!indexExists) {
        await this.elasticsearchService.indices.create({
          index: fullIndexName,
          body: {
            settings,
            mappings,
          },
        });
        this.logger.log(`Index ${fullIndexName} created successfully`);
      } else {
        this.logger.log(`Index ${fullIndexName} already exists`);
      }
    } catch (error) {
      this.logger.error(
        `Error creating index ${fullIndexName}: ${error.message}`,
      );
      throw error;
    }
  }

  async indexDocument(indexName: string, id: string, document: any) {
    const fullIndexName = `${this.indexPrefix}${indexName}`;

    try {
      const result = await this.elasticsearchService.index({
        index: fullIndexName,
        id,
        body: document,
        refresh: true, // Make the document immediately searchable
      });

      this.logger.log(`Document indexed in ${fullIndexName} with ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error indexing document: ${error.message}`);
      throw error;
    }
  }

  async updateDocument(indexName: string, id: string, document: any) {
    const fullIndexName = `${this.indexPrefix}${indexName}`;

    try {
      const result = await this.elasticsearchService.update({
        index: fullIndexName,
        id,
        body: {
          doc: document,
        },
        refresh: true,
      });

      this.logger.log(`Document updated in ${fullIndexName} with ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error updating document: ${error.message}`);
      throw error;
    }
  }

  async deleteDocument(indexName: string, id: string) {
    const fullIndexName = `${this.indexPrefix}${indexName}`;

    try {
      const result = await this.elasticsearchService.delete({
        index: fullIndexName,
        id,
        refresh: true,
      });

      this.logger.log(`Document deleted from ${fullIndexName} with ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting document: ${error.message}`);
      throw error;
    }
  }

  async search(indexName: string, query: any) {
    const fullIndexName = `${this.indexPrefix}${indexName}`;

    try {
      // Đảm bảo các tham số là số nguyên
      if (query.from !== undefined) {
        query.from = Number(query.from);
      }
      if (query.size !== undefined) {
        query.size = Number(query.size);
      }

      const result = await this.elasticsearchService.search({
        index: fullIndexName,
        body: query,
      });

      return {
        hits: result.hits.hits,
        total: result.hits.total,
        aggregations: result.aggregations,
      };
    } catch (error) {
      this.logger.error(
        `Error searching in ${fullIndexName}: ${error.message}`,
      );
      throw error;
    }
  }

  async bulkIndex(
    indexName: string,
    documents: Array<{ id: string; document: any }>,
  ) {
    const fullIndexName = `${this.indexPrefix}${indexName}`;

    try {
      const operations = documents.flatMap((doc) => [
        { index: { _index: fullIndexName, _id: doc.id } },
        doc.document,
      ]);

      const result = await this.elasticsearchService.bulk({
        refresh: true,
        body: operations,
      });

      this.logger.log(
        `Bulk indexed ${documents.length} documents in ${fullIndexName}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error bulk indexing documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete an index
   */
  async deleteIndex(indexName: string) {
    const fullIndexName = `${this.indexPrefix}${indexName}`;

    try {
      await this.elasticsearchService.indices.delete({
        index: fullIndexName,
      });
      this.logger.log(`Index ${fullIndexName} deleted successfully`);
    } catch (error) {
      this.logger.error(
        `Error deleting index ${fullIndexName}: ${error.message}`,
      );
      throw error;
    }
  }

  async indexExists(indexName: string): Promise<boolean> {
    try {
      const result = await this.elasticsearchService.indices.exists({
        index: indexName,
      });
      return result as boolean;
    } catch (error) {
      this.logger.error(
        `Error checking if index ${indexName} exists: ${error.message}`,
      );
      return false;
    }
  }
}
